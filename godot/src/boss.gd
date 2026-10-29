extends Node2D
## THE ALGORITHM — the boss.
##
## Three phases, each telegraphed before it can hurt you. The fight is beatable
## blind because every attack has a tell: the eye narrows before a volley, the
## phone tilts before a dive, the badges light before a summon.

signal defeated

const Toy = preload("res://src/toy.gd")

const MAX_HP := 60

var hp := MAX_HP
var max_hp := MAX_HP
var t := 0.0
var enter := 0.0
var dead := false
var hit_flash := 0.0
var phase := 1
var state := "enter"
var state_t := 0.0
var anchor := Vector2.ZERO
var vel := Vector2.ZERO
var eye_open := 1.0
var game: Node = null
var scale_mult := 1.0
var volley := 0

func setup(g: Node, pos: Vector2) -> void:
	game = g
	anchor = pos
	position = pos + Vector2(0, -320)
	enter = 0.0

func _physics_process(delta: float) -> void:
	if dead:
		position.y += 120.0 * delta
		return
	t += delta
	hit_flash = maxf(0.0, hit_flash - delta * 4.0)
	state_t += delta

	# entrance: drop in from above, then hold station
	if state == "enter":
		position = position.lerp(anchor, clampf(delta * 3.0, 0.0, 1.0))
		if position.distance_to(anchor) < 8.0:
			state = "idle"
			state_t = 0.0
		queue_redraw()
		return

	var frac := float(hp) / float(max_hp)
	phase = 1 if frac > 0.62 else (2 if frac > 0.28 else 3)
	var speed := 1.0 + (phase - 1) * 0.45

	# hover
	var target := anchor + Vector2(sin(t * 0.6) * 90.0, sin(t * 1.3) * 26.0)
	position = position.lerp(target, clampf(delta * 2.2, 0.0, 1.0))

	match state:
		"idle":
			eye_open = lerp(eye_open, 1.0, delta * 6.0)
			if state_t > 2.1 / speed:
				state = _pick_attack()
				state_t = 0.0
		"eye":
			# tell: the eye narrows, then a spread of shots
			eye_open = lerp(eye_open, 0.15, delta * 8.0)
			if state_t > 0.55:
				_fire_volley()
				state = "idle"
				state_t = 0.0
				eye_open = 1.0
		"summon":
			eye_open = lerp(eye_open, 0.6, delta * 4.0)
			if state_t > 0.7:
				_summon()
				state = "idle"
				state_t = 0.0
		"dive":
			# tell: tilts back, then slams the ground and sends a shockwave
			if state_t < 0.6:
				position.y = lerp(position.y, anchor.y - 70.0, delta * 3.0)
			elif state_t < 1.1:
				position.y += 900.0 * delta
			elif state_t < 1.3:
				if game != null:
					game.shake(20.0)
					game.emit_fx("slam", Vector2(position.x, game.ground_y))
					_shockwave()
				state = "idle"
				state_t = 0.0

	# contact damage
	if game != null and game.player != null and not game.player.dead:
		if game.player.global_position.distance_to(global_position) < 70.0 * scale_mult:
			game.player.hurt(global_position)
	queue_redraw()

func _pick_attack() -> String:
	var pool := ["eye", "eye", "summon"]
	if phase >= 2:
		pool.append("dive")
	if phase >= 3:
		pool.append("dive")
		pool.append("eye")
	return pool[randi() % pool.size()]

func _fire_volley() -> void:
	if game == null or game.player == null:
		return
	volley += 1
	var shots := 3 + phase
	var base: float = (game.player.global_position - global_position).angle()
	for i in shots:
		var a: float = base + lerpf(-0.55, 0.55, float(i) / float(max(1, shots - 1)))
		game.spawn_ebullet(global_position + Vector2(0, 10), Vector2.from_angle(a) * 340.0)
	game.shake(6.0)

func _summon() -> void:
	if game == null:
		return
	for i in phase:
		var x := position.x + randf_range(-160.0, 160.0)
		game.spawn_enemy("flyer", Vector2(x, position.y + 60.0))
	game.emit_fx("summon", position)

func _shockwave() -> void:
	if game == null:
		return
	for s in [-1.0, 1.0]:
		game.spawn_ebullet(Vector2(position.x, game.ground_y - 22.0), Vector2(s * 300.0, 0.0))

func apply_hit(dmg: int, dir: Vector2) -> bool:
	if dead:
		return false
	hp -= dmg
	hit_flash = 1.0
	if game != null:
		game.emit_fx("hit", global_position + Vector2(randf_range(-30, 30), randf_range(-40, 40)), {"dir": dir, "colour": Toy.PINK})
	if hp <= 0:
		_die()
		return true
	return false

func _die() -> void:
	dead = true
	if game != null:
		game.on_boss_killed(self)
		for i in 26:
			game.emit_fx("enemy_death", global_position + Vector2(randf_range(-70, 70), randf_range(-80, 80)), {})
		game.shake(30.0)
	defeated.emit()
	queue_free()

func _draw() -> void:
	var body := Toy.LILAC_D
	if hit_flash > 0.02:
		body = body.lerp(Color.WHITE, hit_flash * 0.8)
	var w := 74.0 * scale_mult
	var h := 108.0 * scale_mult

	# crown
	var crown := PackedVector2Array([
		Vector2(-w * 0.45, -h * 0.5), Vector2(-w * 0.45, -h * 0.78), Vector2(-w * 0.2, -h * 0.6),
		Vector2(0, -h * 0.86), Vector2(w * 0.2, -h * 0.6), Vector2(w * 0.45, -h * 0.78),
		Vector2(w * 0.45, -h * 0.5)])
	Toy.shape(self, crown, Toy.GOLD, Toy.INK, 2.4)

	# phone body
	Toy.body(self, Rect2(-w * 0.5, -h * 0.5, w, h), 16.0 * scale_mult, body, 3.0)
	# screen
	var screen := Rect2(-w * 0.38, -h * 0.38, w * 0.76, h * 0.62)
	Toy.body(self, screen, 10.0 * scale_mult, Color("#2a1240"), 2.0)
	# scanlines on the screen
	for i in 7:
		var y := screen.position.y + screen.size.y * float(i) / 7.0
		draw_line(Vector2(screen.position.x + 6, y), Vector2(screen.end.x - 6, y), Color(1, 1, 1, 0.05), 1.0)

	# the eye, opening and closing
	var eye_y := screen.position.y + screen.size.y * 0.45
	var eye_r := 24.0 * scale_mult
	var open := clampf(eye_open, 0.05, 1.0)
	draw_set_transform(Vector2(0, eye_y), 0.0, Vector2(1.0, open))
	draw_circle(Vector2.ZERO, eye_r, Toy.WHITE, true, -1.0, true)
	draw_circle(Vector2(0, 0), eye_r * 0.55, Color("#c9366f"), true, -1.0, true)
	draw_circle(Vector2(0, 0), eye_r * 0.28, Color("#160a1c"), true, -1.0, true)
	draw_circle(Vector2(-eye_r * 0.24, -eye_r * 0.24), eye_r * 0.16, Color.WHITE, true, -1.0, true)
	draw_circle(Vector2.ZERO, eye_r, Toy.INK, false, 2.0, true)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))

	# orbiting notification badges
	var orbit := 7.0 + (phase - 1) * 2.0
	for i in orbit:
		var a := t * (0.8 + 0.2 * phase) + TAU * float(i) / orbit
		var bp := Vector2(cos(a) * (w * 0.95), sin(a) * (h * 0.62))
		var col: Color = [Toy.RED, Toy.BLUE, Toy.GOLD, Toy.MINT][int(i) % 4]
		Toy.blob(self, bp, 9.0 * scale_mult, col, 1.8, 12)
		draw_circle(bp, 3.4 * scale_mult, Toy.WHITE, true, -1.0, true)

	# health bar above, phase pips
	var bw := w * 1.5
	var frac := clampf(float(hp) / float(max_hp), 0.0, 1.0)
	var by := -h * 1.05
	draw_rect(Rect2(-bw * 0.5, by, bw, 8), Color(0.08, 0.04, 0.12, 0.8))
	draw_rect(Rect2(-bw * 0.5, by, bw * frac, 8), Toy.PINK if phase == 3 else (Toy.GOLD if phase == 2 else Toy.MINT))
	draw_rect(Rect2(-bw * 0.5, by, bw, 8), Toy.INK, false, 1.6)
