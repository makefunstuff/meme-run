extends Node2D
## The runner.
##
## Movement is deliberately generous, because a runner that fights you is a bad
## runner: coyote time, a jump buffer, variable jump height, a double jump, a
## dash with invulnerability frames, and air control that actually steers.
## Collision is hand-rolled against circles and rects — no physics bodies — so
## the feel is deterministic and the whole game stays one small download.

signal died

const Toy = preload("res://src/toy.gd")

const RADIUS := 17.0
const GRAVITY := 2450.0
const JUMP_V := -790.0
const JUMP2_V := -690.0
const MAX_FALL := 1500.0
const RUN_SPEED := 330.0
const AIR_ACCEL := 1500.0
const DASH_SPEED := 1250.0
const DASH_TIME := 0.16
const DASH_CD := 0.85
const COYOTE := 0.10
const BUFFER := 0.13

## Weapon table. Each entry is its own feel, not a reskin: rate, spread, damage,
## projectile look, and a quirk that changes how you use it.
const WEAPONS := {
	"blaster": {"label": "BLASTER",  "rate": 0.13, "dmg": 1, "speed": 1150.0, "ammo": -1, "spread": 0.0,  "count": 1, "kind": "bolt",   "knock": 40.0},
	"bread":   {"label": "BREAD",    "rate": 0.30, "dmg": 1, "speed": 880.0,  "ammo": 24, "spread": 0.20, "count": 5, "kind": "crumb",  "knock": 90.0},
	"prism":   {"label": "PRISM",    "rate": 0.075, "dmg": 1, "speed": 1500.0, "ammo": 42, "spread": 0.02, "count": 1, "kind": "laser",  "knock": 20.0, "pierce": true},
	"void":    {"label": "VOID",     "rate": 0.46, "dmg": 3, "speed": 640.0,  "ammo": 10, "spread": 0.0,  "count": 1, "kind": "orb",    "knock": 220.0, "hole": true},
	"sus":     {"label": "SUS",      "rate": 0.20, "dmg": 2, "speed": 900.0,  "ammo": 18, "spread": 0.0,  "count": 1, "kind": "crew",   "knock": 60.0, "homing": true},
	"moon":    {"label": "MOONSHOT", "rate": 0.52, "dmg": 4, "speed": 720.0,  "ammo": 12, "spread": 0.0,  "count": 1, "kind": "rocket", "knock": 300.0, "blast": 74.0},
	"pump":    {"label": "PUMP",     "rate": 0.40, "dmg": 3, "speed": 560.0,  "ammo": 16, "spread": 0.0,  "count": 1, "kind": "pump",   "knock": 160.0, "grow": true},
	"lever":   {"label": "LEVERAGE", "rate": 0.26, "dmg": 5, "speed": 1400.0, "ammo": 14, "spread": 0.0,  "count": 1, "kind": "lever",  "knock": 140.0, "pierce": true},
	"drop":    {"label": "AIRDROP",  "rate": 0.24, "dmg": 1, "speed": 780.0,  "ammo": 44, "spread": 0.36, "count": 4, "kind": "coin",   "knock": 30.0},
}

var vel := Vector2.ZERO
var grounded := false
var jumps_left := 2
var coyote := 0.0
var buffer := 0.0
var dashing := 0.0
var dash_cd := 0.0
var invuln := 0.0
var health := 3
var max_health := 3

var weapon := "blaster"
var ammo := -1
var fire_cd := 0.0
var recoil := 0.0
var muzzle := 0.0
var aim := Vector2.RIGHT
var auto_aim := true

var run_phase := 0.0
var squash := 0.0
var dead := false
var death_t := 0.0
var hit_flash := 0.0
var trail: Array = []          ## recent positions, for the dash smear
var shells: Array = []         ## casing cosmetics

var game: Node = null
var ground_y := 560.0

func setup(g: Node, gy: float) -> void:
	game = g
	ground_y = gy

# ------------------------------------------------------------------ input ---

func _physics_process(delta: float) -> void:
	if dead:
		_death_step(delta)
		return

	coyote = max(0.0, coyote - delta)
	buffer = max(0.0, buffer - delta)
	dash_cd = max(0.0, dash_cd - delta)
	invuln = max(0.0, invuln - delta)
	fire_cd = max(0.0, fire_cd - delta)
	recoil = max(0.0, recoil - delta * 4.5)
	muzzle = max(0.0, muzzle - delta * 12.0)
	hit_flash = max(0.0, hit_flash - delta * 4.0)
	squash = lerpf(squash, 0.0, delta * 12.0)

	if Input.is_action_just_pressed("jump"):
		buffer = BUFFER
	if Input.is_action_just_released("jump") and vel.y < 0.0:
		vel.y *= 0.45                    # variable jump height
	if Input.is_action_just_pressed("dash") and dash_cd <= 0.0:
		_start_dash()
	if Input.is_action_pressed("shoot"):
		_try_shoot()

	_aim()
	_move(delta)
	_animate(delta)

# ------------------------------------------------------------------- aim ----

func _aim() -> void:
	# Auto-aim at the nearest enemy ahead, with a mouse override. Auto-aim is on
	# by default because aiming with a keyboard is a tax, not a skill.
	var target: Node2D = null
	var best := 430.0
	if auto_aim and game != null:
		for e in game.enemies:
			if not is_instance_valid(e) or e.dead:
				continue
			var d: float = e.global_position.distance_to(global_position)
			if d < best and e.global_position.x > global_position.x - 60.0:
				best = d
				target = e
	if target != null:
		aim = (target.global_position - global_position - Vector2(0, 6)).normalized()
	else:
		# With nothing to shoot at, fire forward. Falling back to the mouse meant
		# a player who never touched it sprayed bullets into the sky from (0, 0).
		aim = Vector2.RIGHT

# ------------------------------------------------------------------ move ----

func _move(delta: float) -> void:
	var running := true
	if game != null:
		running = game.is_running()

	if dashing > 0.0:
		dashing -= delta
		vel = Vector2(DASH_SPEED, 0.0)
		if dashing <= 0.0:
			vel.x = RUN_SPEED
	else:
		# auto-run, with air control and a brake that lets you back off a bad gap
		var drift := 0.0
		if Input.is_action_pressed("move_left"):
			drift = -AIR_ACCEL
		elif Input.is_action_pressed("move_right"):
			drift = AIR_ACCEL
		var target := RUN_SPEED
		if game != null:
			target = game.run_speed
		if grounded:
			vel.x = move_toward(vel.x, target, (900.0 + absf(drift)) * delta)
		else:
			vel.x = move_toward(vel.x, target, ABS_ACCEL(delta))
		vel.x += drift * delta * (1.0 if not grounded else 0.55)
		vel.y = min(vel.y + GRAVITY * delta, MAX_FALL)

		if buffer > 0.0 and (grounded or coyote > 0.0 or jumps_left > 0):
			if grounded or coyote > 0.0:
				vel.y = JUMP_V
				jumps_left = 1
				coyote = 0.0
				squash = -0.6
				game.emit_fx("jump", global_position)
			elif jumps_left > 0:
				vel.y = JUMP2_V
				jumps_left -= 1
				squash = -0.45
				game.emit_fx("double_jump", global_position)
			buffer = 0.0

	position += vel * delta

	if position.y >= ground_y - RADIUS:
		if not grounded and vel.y > 320.0:
			squash = 0.5
			if game != null:
				game.emit_fx("land", Vector2(position.x, ground_y))
		position.y = ground_y - RADIUS
		vel.y = 0.0
		if not grounded:
			grounded = true
		jumps_left = 2
		coyote = COYOTE
	elif not grounded:
		coyote = max(0.0, coyote - delta)

	# ceiling so a double jump cannot leave the screen
	if position.y < -40.0:
		position.y = -40.0
		vel.y = max(vel.y, 0.0)

	position.x = max(position.x, 60.0)

func ABS_ACCEL(delta: float) -> float:
	return AIR_ACCEL * delta

func _start_dash() -> void:
	dashing = DASH_TIME
	dash_cd = DASH_CD
	invuln = max(invuln, DASH_TIME + 0.08)
	trail.clear()
	if game != null:
		game.emit_fx("dash", global_position)
		if randf() < 0.5:
			game.say_event("player_dash", self, {"duration": 1.0, "cooldown": 3.0})

# ------------------------------------------------------------------ shoot ---

func _try_shoot() -> void:
	if fire_cd > 0.0:
		return
	var w: Dictionary = WEAPONS[weapon]
	if ammo == 0:
		weapon = "blaster"
		ammo = -1
		return
	fire_cd = w["rate"]
	recoil = 1.0
	muzzle = 1.0
	squash = 0.22
	if ammo > 0:
		ammo -= 1
		if ammo == 0:
			weapon = "blaster"
			ammo = -1
	var count: int = w["count"]
	var spread: float = w["spread"]
	var base := aim.angle()
	for i in count:
		var a := base
		if count > 1:
			a += lerp(-spread, spread, float(i) / float(max(1, count - 1)))
		elif spread > 0.0:
			a += randf_range(-spread, spread)
		var dir := Vector2.from_angle(a)
		game.spawn_bullet(global_position + dir * 26.0 + Vector2(0, -4), dir * w["speed"], w, self)
	# knockback pushes you away from your own shot: shotguns feel like shotguns
	vel -= aim * w["knock"]
	game.emit_fx("muzzle", global_position + aim * 30.0, {"dir": aim, "weapon": weapon})
	shells.append({"pos": global_position + Vector2(-6, -4), "vel": Vector2(randf_range(-90, -30), randf_range(-160, -90)), "life": 1.2})
	game.shake(2.6 if w["kind"] != "crumb" else 5.0)

# ------------------------------------------------------------------ damage --

func hurt(from: Vector2) -> bool:
	if dead or invuln > 0.0:
		return false
	health -= 1
	invuln = 1.15
	hit_flash = 1.0
	var dir := (global_position - from).normalized()
	vel = dir * 420.0 + Vector2(0, -260.0)
	game.shake(14.0)
	game.hitstop(0.09)
	game.emit_fx("hurt", global_position)
	game.say_event("player_damage", self, {"duration": 1.3, "cooldown": 2.5})
	if health <= 0:
		_die()
		return true
	return false

func heal(n: int) -> void:
	health = min(max_health, health + n)

func _die() -> void:
	dead = true
	death_t = 0.0
	vel = Vector2(-120, -620)
	game.shake(22.0)
	if game != null:
		game.emit_fx("death", global_position)
	died.emit()

func _death_step(delta: float) -> void:
	death_t += delta
	vel.y += GRAVITY * 0.8 * delta
	position += vel * delta
	if position.y > ground_y + 200.0:
		position.y = ground_y + 200.0
		vel = Vector2.ZERO

# ---------------------------------------------------------------- visuals ---

func _animate(delta: float) -> void:
	run_phase += delta * (6.0 + absf(vel.x) / 90.0)
	if dashing > 0.0:
		trail.append(global_position)
		if trail.size() > 6:
			trail.pop_front()
	else:
		trail.clear()
	for s in shells:
		s["life"] -= delta
		s["vel"] += Vector2(0, 900.0) * delta
		s["pos"] += s["vel"] * delta
	shells = shells.filter(func(s): return s["life"] > 0.0)
	queue_redraw()

func _draw() -> void:
	# everything below is drawn in local space (node sits at the player origin)
	var flicker := invuln > 0.0 and fmod(invuln * 14.0, 2.0) < 1.0
	var body_col := Toy.PINK
	if hit_flash > 0.02:
		body_col = body_col.lerp(Color.WHITE, hit_flash * 0.7)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))
	# dash smear
	for i in trail.size():
		var t2 := float(i) / float(max(1, trail.size()))
		var p := to_local(trail[i])
		draw_circle(p, RADIUS * (0.5 + t2 * 0.5), Color(1.0, 0.45, 0.55, 0.10 + t2 * 0.12), true, -1.0, true)

	if dead:
		_draw_dead(body_col)
		return

	var a := 1.0 if not flicker else 0.45
	var facing := 1.0 if aim.x >= 0.0 else -1.0

	# drawn at 1.3x: the collision radius stays honest, so this is purely a
	# reading-size decision — the character was under 8% of screen height
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(1.3, 1.3))

	# contact shadow: without it the character floats above the floor
	var air := clampf(1.0 - (ground_y_offset()) / 260.0, 0.35, 1.0)
	draw_circle(Vector2(0, 22), 17.0 * air, Color(0.1, 0.05, 0.12, 0.22 * air), true, -1.0, true)

	# ---- legs: two capsules that scissor with the run phase
	var leg_swing := sin(run_phase) * (10.0 if grounded else 4.0)
	for i in 2:
		var s := -1.0 if i == 0 else 1.0
		var hip := Vector2(s * 6.0, 4.0)
		var foot := hip + Vector2(sin(run_phase + float(i) * PI) * 10.0 + leg_swing * 0.2, 22.0)
		if not grounded:
			foot = hip + Vector2(s * 6.0 + 2.0, 16.0 - float(i) * 4.0)
		draw_line(hip, foot, Color(Toy.DARK, a), 9.0, true)
		draw_line(hip, foot, Color("#3f4a6b", a), 6.5, true)
		# shoe
		var shoe := Rect2(foot + Vector2(-7, -3), Vector2(15, 8))
		Toy.body(self, shoe, 3.5, Color(Toy.GOLD, a), 1.8)

	# ---- body
	var body_rect := Rect2(-15, -20, 30, 30)
	if dashing > 0.0:
		body_rect = Rect2(-17, -19, 34, 26)
	Toy.body(self, body_rect, 8.0, Color(body_col, a), 2.4)
	# hem
	draw_rect(Rect2(-13, 6, 26, 4), Color(Toy.PINK_D, a))
	# pocket
	Toy.body(self, Rect2(-8, 0, 16, 8), 3.0, Color(Toy.PINK_D, a), 1.4)

	# ---- backpack, behind
	Toy.body(self, Rect2(-24, -14, 12, 18), 4.5, Color(Toy.PINK_D, a), 2.0)

	# ---- head: big, offset toward the aim, with a hood
	var head_c := Vector2(2.0 * facing, -30.0) + aim * 2.0
	# hood first: drawn after the skull it just paints over the face
	draw_circle(head_c + Vector2(0, -3), 17.0, Color(Toy.PINK_D, a), true, -1.0, true)
	draw_circle(head_c + Vector2(0, -3), 17.0, Color(Toy.INK, a), false, 2.0, true)
	Toy.blob(self, head_c, 14.5, Color(Toy.SKIN, a), 2.4, 24)
	# fringe, on top of the skin, kept above the eyes
	var fringe := PackedVector2Array([
		head_c + Vector2(-13, -7), head_c + Vector2(-10, -14),
		head_c + Vector2(0, -16), head_c + Vector2(10, -14),
		head_c + Vector2(13, -6), head_c + Vector2(6, -10),
		head_c + Vector2(-2, -8), head_c + Vector2(-8, -10)])
	Toy.shape(self, fringe, Color("#743d4a", a), Color(Toy.INK, a), 1.4)
	# face
	Toy.eye_pair(self, head_c + Vector2(1, 1), 4.6, 6.2, aim * 1.6)
	Toy.blush(self, head_c + Vector2(0, 6), 2.6)
	Toy.mouth(self, head_c + Vector2(1, 9), 9.0, 4.0, 0.7 if not dead else -0.2, Color("#8a3a4c", a))

	# ---- near arm + gun, pointed along the aim
	var shoulder := Vector2(6, -10)
	var arm_end := shoulder + aim * 16.0
	draw_line(shoulder, arm_end, Color(Toy.PINK_D, a), 8.0, true)
	draw_circle(arm_end, 4.6, Color(Toy.SKIN, a), true, -1.0, true)
	_draw_gun(arm_end, a)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))

	# muzzle flash
	if muzzle > 0.02:
		var tip := arm_end + aim * 20.0
		Toy.glow(self, tip, 18.0 * muzzle, Color(1.0, 0.95, 0.6), 0.6)
		Toy.sparkle(self, tip, 8.0 * muzzle, Color(1, 0.98, 0.85, 0.9))

	# shells
	for s in shells:
		draw_circle(to_local(s["pos"]), 1.8, Color(Toy.GOLD_D, clampf(s["life"], 0.0, 1.0)), true, -1.0, true)

func ground_y_offset() -> float:
	# how far the player is above the floor, for the shadow
	if game == null:
		return 0.0
	return maxf(0.0, game.ground_y - global_position.y - RADIUS)

func _draw_gun(at: Vector2, a: float) -> void:
	var ang := aim.angle()
	var w: Dictionary = WEAPONS.get(weapon, WEAPONS["blaster"])
	var kick := recoil * 4.0
	var base := at - aim * kick
	var col: Color
	var len := 22.0
	match w["kind"]:
		"laser": col = Toy.BLUE_L; len = 28.0
		"orb": col = Toy.LILAC; len = 20.0
		"rocket": col = Toy.PINK_L; len = 26.0
		"coin": col = Toy.GOLD; len = 18.0
		"crumb": col = Color("#e8b072"); len = 20.0
		"crew": col = Toy.RED; len = 22.0
		"pump": col = Toy.MINT; len = 24.0
		"lever": col = Toy.BLUE; len = 26.0
		_: col = Toy.BLUE_L
	var dir := Vector2.from_angle(ang)
	var perp := dir.orthogonal()
	# body
	var p0 := base - dir * 6.0
	var p1 := base + dir * len
	draw_line(p0, p1, Toy.INK, 15.0, true)
	draw_line(p0, p1, Color("#5b6076"), 10.5, true)
	draw_line(p0 + perp * 2.0, p1 + perp * 2.0, Color(1, 1, 1, 0.22), 2.4, true)
	# grip
	draw_line(base, base + perp * 12.0 - dir * 2.0, Toy.INK, 12.0, true)
	draw_line(base, base + perp * 12.0 - dir * 2.0, Color("#2f2a3a"), 8.5, true)
	# muzzle glow ring
	draw_circle(p1, 5.4, Color(col, a), true, -1.0, true)
	draw_circle(p1, 5.4, Toy.INK, false, 1.6, true)
	Toy.glow(self, p1, 14.0, col, 0.4)

func _draw_dead(col: Color) -> void:
	# a toy that has been switched off
	var spin := death_t * 6.0
	draw_set_transform(Vector2.ZERO, spin, Vector2(1, 1))
	Toy.body(self, Rect2(-14, -14, 28, 28), 8.0, col, 2.4)
	draw_circle(Vector2(0, -8), 12.0, Toy.SKIN, true, -1.0, true)
	for s in [-1.0, 1.0]:
		draw_line(Vector2(s * 5 - 3, -10), Vector2(s * 5 + 3, -6), Toy.INK, 2.0, true)
		draw_line(Vector2(s * 5 - 3, -6), Vector2(s * 5 + 3, -10), Toy.INK, 2.0, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))
