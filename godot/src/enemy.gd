extends Node2D
## The cast.
##
## Every enemy is a recognisable meme archetype rather than a rounded rectangle
## with two dots: a shiba, a frog, a wojak, a chad, a candle, a bonk coin, a
## whale, a rocket, a rekt skull, an NPC and a rug. Each one has its own
## silhouette, its own face furniture, its own voice, and a movement rule that
## matches what it is — the chad charges, the rocket flies, the rug splits.
##
## Keeping them in one file means the shared machinery (hit flash, knockback,
## health bar, death payout, label chip, barks) exists once, and a new archetype
## is a table row plus a draw function.

const Toy = preload("res://src/toy.gd")
const StickerScript = preload("res://src/sticker.gd")


signal killed(enemy)

## behaviour is the movement rule; body is the base tint for the hit flash.
const KINDS := {
	"shibe":  {"hp": 3,  "r": 22.0, "speed": 105.0, "label": "SHIBE",  "coins": 2, "body": Color("#d9a55f"), "behaviour": "walk"},
	"frog":   {"hp": 3,  "r": 23.0, "speed": 95.0,  "label": "FROG",   "coins": 2, "body": Color("#63b544"), "behaviour": "hop"},
	"wojak":  {"hp": 4,  "r": 23.0, "speed": 78.0,  "label": "WOJAK",  "coins": 3, "body": Color("#dfd7cf"), "behaviour": "walk"},
	"chad":   {"hp": 5,  "r": 26.0, "speed": 82.0,  "label": "CHAD",   "coins": 4, "body": Color("#e8b98a"), "behaviour": "charge"},
	"candle": {"hp": 3,  "r": 24.0, "speed": 92.0,  "label": "CANDLE", "coins": 3, "body": Color("#4fd07a"), "behaviour": "walk"},
	"bonk":   {"hp": 4,  "r": 24.0, "speed": 120.0, "label": "BONK",   "coins": 4, "body": Color("#ffd166"), "behaviour": "charge"},
	"whale":  {"hp": 9,  "r": 38.0, "speed": 66.0,  "label": "WHALE",  "coins": 6, "body": Color("#5b8fd6"), "behaviour": "walk"},
	"rocket": {"hp": 3,  "r": 22.0, "speed": 150.0, "label": "ROCKET", "coins": 3, "body": Color("#e9eef6"), "behaviour": "fly"},
	"rekt":   {"hp": 4,  "r": 22.0, "speed": 70.0,  "label": "REKT",   "coins": 3, "body": Color("#eef1f6"), "behaviour": "shoot"},
	"npc":    {"hp": 3,  "r": 22.0, "speed": 88.0,  "label": "NPC",    "coins": 2, "body": Color("#9aa7bd"), "behaviour": "drift"},
	"rug":    {"hp": 5,  "r": 27.0, "speed": 84.0,  "label": "RUG",    "coins": 4, "body": Color("#c9436a"), "behaviour": "split"},
}

var kind := "shibe"
var data: Dictionary
var hp := 3
var max_hp := 3
var radius := 22.0
var vel := Vector2.ZERO
var phase := 0.0
var t := 0.0
var dead := false
var hit_flash := 0.0
var knock := Vector2.ZERO
var shoot_cd := 1.2
var charge_state := "idle"
var charge_t := 0.0
var spawn_t := 0.0
var blink := 0.0
var blink_cd := 1.5
var game: Node = null
var scale_factor := 1.0
var facing := -1.0
var wobble := 0.0
var sticker: Sticker = null

func setup(g: Node, k: String, pos: Vector2, scale_mul: float = 1.0) -> void:
	game = g
	kind = k if KINDS.has(k) else "shibe"
	data = KINDS[kind]
	max_hp = int(data["hp"])
	hp = max_hp
	radius = float(data["r"]) * scale_mul
	scale_factor = scale_mul
	position = pos
	phase = randf() * TAU
	shoot_cd = randf_range(0.7, 1.8)
	blink_cd = randf_range(0.8, 3.0)
	charge_t = randf_range(0.8, 1.8)
	sticker = StickerScript.new(_paint)
	sticker.set_outline(0.0)
	add_child(sticker)
	if randf() < 0.45:
		game.say_event(kind + "_spawn", self, {"duration": 1.6, "cooldown": 99.0})

func _physics_process(delta: float) -> void:
	if dead:
		return
	t += delta
	wobble += delta * (6.0 + absf(vel.x) * 0.02)
	hit_flash = maxf(0.0, hit_flash - delta * 5.0)
	spawn_t = minf(1.0, spawn_t + delta * 3.0)
	blink_cd -= delta
	if blink_cd <= 0.0:
		blink = 0.12
		blink_cd = randf_range(1.6, 4.5)
	blink = maxf(0.0, blink - delta)

	if game != null and game.hold_creatures:
		wobble = sin(t * 2.0) * 0.05
		blink = 0.0
		hit_flash = 0.0
		redraw()
		return
	if game == null:
		redraw()
		return
	var player: Node2D = game.player
	if player == null or player.dead:
		_drift_home(delta)
		redraw()
		return

	var to_player: Vector2 = player.global_position - global_position
	if absf(to_player.x) > 6.0:
		facing = signf(to_player.x)
	_move(delta, player)
	position += knock * delta
	knock = knock.lerp(Vector2.ZERO, delta * 7.0)

	if to_player.length() < radius + 16.0:
		player.hurt(global_position)
	redraw()

func _drift_home(delta: float) -> void:
	vel.x = move_toward(vel.x, -float(data["speed"]), 200.0 * delta)
	position += vel * delta

func _move(delta: float, player: Node2D) -> void:
	var chase: Vector2 = (player.global_position - global_position).normalized()
	var speed: float = float(data["speed"])
	match String(data["behaviour"]):
		"walk", "split":
			vel.x = move_toward(vel.x, -speed, 320.0 * delta)
			vel.y = sin(t * 2.4 + phase) * 6.0
		"hop":
			# frog: crouch, then a real jump arc. Telegraphed by squashing.
			vel.x = move_toward(vel.x, -speed * 0.45, 300.0 * delta)
			vel.y += 2100.0 * delta
			position.y += vel.y * delta
			var floor_y: float = game.ground_y - radius
			if position.y >= floor_y:
				position.y = floor_y
				if vel.y > 0.0:
					vel.y = 0.0
					charge_t -= delta
					if charge_t <= 0.0:
						charge_t = randf_range(1.0, 2.0)
						vel.y = -520.0
						vel.x = -speed * 1.9
			return
		"fly":
			var want_x: float = -speed
			vel.x = move_toward(vel.x, want_x, 300.0 * delta)
			var target_y: float = player.global_position.y - 110.0
			vel.y = move_toward(vel.y, clampf(target_y - position.y, -90.0, 90.0) * 1.5, 420.0 * delta)
		"shoot":
			var dist: float = absf(chase.x)
			var want := 0.0
			if dist < 330.0:
				want = 100.0
			elif dist > 500.0:
				want = -80.0
			vel.x = move_toward(vel.x, want, 260.0 * delta)
			vel.y = sin(t * 1.6 + phase) * 10.0
			shoot_cd -= delta
			if shoot_cd <= 0.0:
				shoot_cd = 2.0
				game.spawn_ebullet(global_position + Vector2(facing * 12.0, -4.0),
					chase * 360.0)
		"drift":
			vel.x = move_toward(vel.x, -speed, 240.0 * delta)
			vel.y = sin(t * 1.2 + phase) * 30.0
		"charge":
			charge_t -= delta
			match charge_state:
				"idle":
					vel.x = move_toward(vel.x, -speed * 0.7, 260.0 * delta)
					if charge_t <= 0.0 and absf(chase.x) < 470.0:
						charge_state = "wind"
						charge_t = 0.42
				"wind":
					vel.x = move_toward(vel.x, 0.0, 600.0 * delta)
					if charge_t <= 0.0:
						charge_state = "dash"
						charge_t = 0.5
						vel = chase * 700.0
				"dash":
					if charge_t <= 0.0:
						charge_state = "idle"
						charge_t = randf_range(1.4, 2.2)
	position += vel * delta

	# ground clamp for the walkers
	if String(data["behaviour"]) in ["walk", "split", "charge", "shoot"]:
		var floor_y: float = game.ground_y - radius
		if position.y > floor_y:
			position.y = floor_y

func apply_hit(dmg: int, dir: Vector2) -> bool:
	if dead:
		return false
	hp -= dmg
	hit_flash = 1.0
	knock = dir.normalized() * 220.0
	if randf() < 0.18:
		game.say_event("hit", self, {"duration": 1.1})
	if hp <= 0:
		_die()
		return true
	return false

func _die() -> void:
	dead = true
	if game != null:
		game.emit_fx("enemy_death", global_position, {"kind": kind, "colour": data["body"]})
		game.say_death_at(global_position)
		game.on_enemy_killed(self, int(data["coins"]))
	if kind == "rug" and scale_factor > 0.7:
		for s in [-1.0, 1.0]:
			game.spawn_enemy("rug", global_position + Vector2(s * 20.0, 0), 0.66)
	killed.emit(self)
	queue_free()

# ============================================================ drawing ======

## Redraw the sticker-wrapped body. Kept as a method so call sites stay one
## token and never disturb indentation.
func redraw() -> void:
	if sticker != null:
		sticker.redraw()
		sticker.set_aberration(hit_flash * 2.5)

func _paint(ci: CanvasItem) -> void:
	Toy.sticker = true
	Toy.sticker_pad = 3.0
	var pop := 0.62 + 0.38 * spawn_t
	ci.draw_circle(Vector2(0, radius * 0.95), radius * 0.85, Color(0.1, 0.05, 0.12, 0.26), true, -1.0, true)
	ci.draw_set_transform(Vector2.ZERO, 0.0, Vector2((2.0 - pop) * 1.18, pop * 1.18))

	var tint := Color(1, 1, 1, 1)
	var body: Color = data["body"]
	if hit_flash > 0.02:
		body = body.lerp(Color.WHITE, hit_flash * 0.85)
		tint = Color(1, 1, 1, 1)

	match kind:
		"shibe": _draw_shibe(ci, body)
		"frog": _draw_frog(ci, body)
		"wojak": _draw_wojak(ci, body)
		"chad": _draw_chad(ci, body)
		"candle": _draw_candle(ci, body)
		"bonk": _draw_bonk(ci, body)
		"whale": _draw_whale(ci, body)
		"rocket": _draw_rocket(ci, body)
		"rekt": _draw_rekt(ci, body)
		"npc": _draw_npc(ci, body)
		"rug": _draw_rug(ci, body)
		_: _draw_shibe(ci, body)

	ci.draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))

	if max_hp > 4:
		var w := radius * 1.7
		var frac := clampf(float(hp) / float(max_hp), 0.0, 1.0)
		var bar := Rect2(-w * 0.5, -radius * 1.62, w, 5)
		Toy.shape(ci, Toy.round_rect(bar, 2.5), Color(0.09, 0.05, 0.12, 0.75), Toy.INK, 1.2)
		ci.draw_rect(Rect2(bar.position + Vector2(1, 1), Vector2((w - 2) * frac, 3)),
			Toy.MINT if frac > 0.5 else (Toy.GOLD if frac > 0.25 else Toy.RED))

	if game != null and game.labels_on:
		var player: Node2D = game.player
		if player != null and player.global_position.distance_to(global_position) < 430.0:
			var label: String = data["label"]
			var font: Font = ThemeDB.fallback_font
			var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x
			var chip := Rect2(-tw * 0.5 - 7, -radius * 1.9, tw + 14, 15)
			Toy.shape(ci, Toy.round_rect(chip, 7.5), Color(0.99, 0.97, 0.94, 0.94), Toy.INK, 1.3)
			Toy.text(ci, Vector2(0, chip.position.y + 11), label, 10, Color("#6b4560"),
				HORIZONTAL_ALIGNMENT_CENTER)

func _eyes(ci: CanvasItem, c: Vector2, r: float, dx: float, look: float = 0.3, pupil: Color = Color("#22131f")) -> void:
	var open := 1.0 if blink <= 0.0 else 0.15
	for s in [-1.0, 1.0]:
		var p := c + Vector2(s * dx, 0)
		if open < 0.3:
			ci.draw_line(p + Vector2(-r * 0.8, 0), p + Vector2(r * 0.8, 0), Toy.INK, maxf(1.4, r * 0.3), true)
		else:
			ci.draw_circle(p, r, Color("#fffaf9"), true, -1.0, true)
			ci.draw_circle(p, r, Toy.INK, false, maxf(1.0, r * 0.16), true)
			ci.draw_circle(p + Vector2(facing * look * r, 0.0), r * 0.58, pupil, true, -1.0, true)
			ci.draw_circle(p + Vector2(-r * 0.28, -r * 0.3), r * 0.2, Color("#ffffff"), true, -1.0, true)

## SHIBE — the dog. Pointy ears, snout, black nose, permanent side-eye.
func _draw_shibe(ci: CanvasItem, body: Color) -> void:
	var r := radius
	# ears
	for s in [-1.0, 1.0]:
		var ear := PackedVector2Array([
			Vector2(s * r * 0.34, -r * 0.62), Vector2(s * r * 0.72, -r * 1.24),
			Vector2(s * r * 0.86, -r * 0.5)])
		Toy.shape(ci, ear, body.darkened(0.18), Toy.INK, 2.0)
	# head
	Toy.shape(ci, Toy.round_rect(Rect2(-r, -r, r * 2, r * 1.75), r * 0.5), body, Toy.INK, 2.4)
	# snout + nose
	var snout := PackedVector2Array(Toy.ellipse(Vector2(facing * r * 0.22, r * 0.34), r * 0.52, r * 0.36, 16))
	Toy.shape(ci, snout, Color("#f4e2c6"), Toy.INK, 1.6)
	ci.draw_colored_polygon(Toy.ellipse(Vector2(facing * r * 0.5, r * 0.2), r * 0.16, r * 0.12, 12), Color("#2b1d22"))
	# side-eye: pupils pushed to one side, half-lidded
	_eyes(ci, Vector2(0, -r * 0.2), r * 0.28, r * 0.44, 0.55)
	for s in [-1.0, 1.0]:
		ci.draw_line(Vector2(s * r * 0.44 - r * 0.3, -r * 0.47), Vector2(s * r * 0.44 + r * 0.3, -r * 0.4),
			Toy.INK, 2.0, true)
	# legs and tail
	for s in [-1.0, 1.0]:
		ci.draw_rect(Rect2(s * r * 0.42 - r * 0.13, r * 0.7, r * 0.26, r * 0.32), body.darkened(0.2))
	ci.draw_arc(Vector2(-facing * r * 0.9, r * 0.1), r * 0.4, 0.4, 3.4, 10, body.darkened(0.1), r * 0.2, true)

## FROG — eyes on top of the head, a mouth that goes all the way across.
func _draw_frog(ci: CanvasItem, body: Color) -> void:
	var r := radius
	var squash := 1.0 + (-0.12 if vel.y < -80.0 else 0.0) + (0.12 if vel.y > 200.0 else 0.0)
	# legs
	for s in [-1.0, 1.0]:
		ci.draw_line(Vector2(s * r * 0.6, r * 0.55), Vector2(s * r * 0.95, r * 0.95), Toy.INK, r * 0.28, true)
		ci.draw_line(Vector2(s * r * 0.6, r * 0.55), Vector2(s * r * 0.95, r * 0.95), body.darkened(0.15), r * 0.18, true)
	# body
	Toy.shape(ci, Toy.ellipse(Vector2(0, r * 0.15), r * 0.98, r * 0.82 * squash, 22), body, Toy.INK, 2.4)
	# belly
	ci.draw_colored_polygon(Toy.ellipse(Vector2(0, r * 0.42), r * 0.6, r * 0.34, 16), Color("#d8f0a8"))
	# eye domes on top
	for s in [-1.0, 1.0]:
		var dome := Vector2(s * r * 0.48, -r * 0.6)
		ci.draw_circle(dome, r * 0.42, body, true, -1.0, true)
		ci.draw_circle(dome, r * 0.42, Toy.INK, false, 2.0, true)
		ci.draw_circle(dome, r * 0.26, Color("#fffaf9"), true, -1.0, true)
		ci.draw_circle(dome + Vector2(facing * r * 0.08, 0), r * 0.14, Toy.INK, true, -1.0, true)
	# wide grin
	ci.draw_arc(Vector2(0, r * 0.05), r * 0.72, 0.35, PI - 0.35, 16, Toy.INK, 2.2, true)

## WOJAK — pale bald head, worried brows, the thousand-yard frown.
func _draw_wojak(ci: CanvasItem, body: Color) -> void:
	var r := radius
	# shoulders
	Toy.shape(ci, Toy.round_rect(Rect2(-r * 0.85, r * 0.55, r * 1.7, r * 0.7), r * 0.3),
		Color("#8fa0bb"), Toy.INK, 2.0)
	# head
	Toy.shape(ci, Toy.ellipse(Vector2(0, -r * 0.1), r * 0.78, r * 0.95, 24), body, Toy.INK, 2.2)
	# worried brows
	for s in [-1.0, 1.0]:
		var b0 := Vector2(s * r * 0.62, -r * 0.5)
		var b1 := Vector2(s * r * 0.16, -r * 0.36)
		ci.draw_line(b0, b1, Toy.INK, 2.4, true)
	# eyes, small and sad
	_eyes(ci, Vector2(0, -r * 0.22), r * 0.17, r * 0.34, 0.2)
	# nose and downturned mouth
	ci.draw_line(Vector2(facing * r * 0.04, -r * 0.06), Vector2(facing * r * 0.12, r * 0.16), Color(Toy.INK, 0.7), 1.8, true)
	ci.draw_arc(Vector2(0, r * 0.52), r * 0.34, PI + 0.5, TAU - 0.5, 12, Toy.INK, 2.2, true)

## CHAD — square jaw, thick neck, sunglasses. Charges at things confidently.
func _draw_chad(ci: CanvasItem, body: Color) -> void:
	var r := radius
	# shoulders
	Toy.shape(ci, Toy.round_rect(Rect2(-r * 0.95, r * 0.5, r * 1.9, r * 0.8), r * 0.22),
		Color("#c9ced8"), Toy.INK, 2.2)
	# the jaw is the joke: narrower at the temples, square at the bottom
	var jaw := PackedVector2Array([
		Vector2(-r * 0.5, -r * 0.95), Vector2(r * 0.5, -r * 0.95),
		Vector2(r * 0.62, -r * 0.2), Vector2(r * 0.58, r * 0.5),
		Vector2(r * 0.22, r * 0.62), Vector2(-r * 0.22, r * 0.62),
		Vector2(-r * 0.58, r * 0.5), Vector2(-r * 0.62, -r * 0.2)])
	Toy.shape(ci, jaw, body, Toy.INK, 2.4)
	# ears
	for s2 in [-1.0, 1.0]:
		ci.draw_circle(Vector2(s2 * r * 0.6, -r * 0.1), r * 0.13, body.darkened(0.1), true, -1.0, true)
		ci.draw_circle(Vector2(s2 * r * 0.6, -r * 0.1), r * 0.13, Toy.INK, false, 1.4, true)
	# heavy brow
	ci.draw_rect(Rect2(-r * 0.42, -r * 0.66, r * 0.84, r * 0.14), body.darkened(0.2))
	# two lenses and a bridge, not one bar
	for s2 in [-1.0, 1.0]:
		var lens := Rect2(s2 * r * 0.26 - r * 0.17, -r * 0.44, r * 0.34, r * 0.24)
		ci.draw_colored_polygon(Toy.round_rect(lens, r * 0.08), Color("#15111c"))
		ci.draw_rect(lens, Toy.INK, false, 1.6)
		ci.draw_line(Vector2(lens.position.x + r * 0.06, lens.position.y + r * 0.06),
			Vector2(lens.position.x + r * 0.14, lens.position.y + r * 0.1), Color(1, 1, 1, 0.55), 2.0, true)
	ci.draw_line(Vector2(-r * 0.09, -r * 0.34), Vector2(r * 0.09, -r * 0.34), Color("#15111c"), 2.6, true)
	# jawline shadow + a confident smirk
	ci.draw_line(Vector2(-r * 0.3, r * 0.18), Vector2(r * 0.34, r * 0.12), Toy.INK, 2.6, true)
	ci.draw_line(Vector2(r * 0.34, r * 0.12), Vector2(r * 0.44, r * 0.02), Toy.INK, 2.2, true)

## CANDLE — a literal candlestick: wick, body, and the colour says which way.
func _draw_candle(ci: CanvasItem, body: Color) -> void:
	var r := radius
	var up: bool = body.g > body.r
	var wick_top := -r * 1.5
	# wick
	ci.draw_line(Vector2(0, wick_top), Vector2(0, -r * 0.85), Toy.INK, 3.0, true)
	# body: thin and tall, like a candle on a chart
	var rect := Rect2(-r * 0.42, -r * 0.9, r * 0.84, r * 1.9)
	Toy.shape(ci, Toy.round_rect(rect, r * 0.14), body, Toy.INK, 2.2)
	ci.draw_rect(Rect2(rect.position.x + r * 0.06, rect.position.y + r * 0.1, r * 0.16, rect.size.y - r * 0.2),
		Color(1, 1, 1, 0.25))
	# face on the body
	_eyes(ci, Vector2(0, -r * 0.4), r * 0.16, r * 0.24, 0.2)
	var m0: float = PI + 0.4 if up else 0.3
	var m1: float = TAU - 0.4 if up else PI - 0.3
	ci.draw_arc(Vector2(0, r * 0.42), r * 0.2, m0, m1, 8, Toy.INK, 1.8, true)
	# little arms, because it is a character
	ci.draw_line(Vector2(-r * 0.42, 0), Vector2(-r * 0.72, r * 0.2), Toy.INK, 2.0, true)
	ci.draw_line(Vector2(r * 0.42, 0), Vector2(r * 0.72, -r * 0.1), Toy.INK, 2.0, true)

## BONK — the coin with a bat.
func _draw_bonk(ci: CanvasItem, body: Color) -> void:
	var r := radius
	# the bat, swung by the phase
	var swing := sin(t * 4.0) * 0.5 - 0.4
	var bat_base := Vector2(facing * r * 0.7, r * 0.1)
	var bat_tip := bat_base + Vector2(facing * cos(swing), sin(swing)) * r * 1.5
	ci.draw_line(bat_base, bat_tip, Toy.INK, r * 0.34, true)
	ci.draw_line(bat_base, bat_tip, Color("#c98c5a"), r * 0.22, true)
	ci.draw_circle(bat_tip, r * 0.2, Color("#a9713f"), true, -1.0, true)
	ci.draw_circle(bat_tip, r * 0.2, Toy.INK, false, 1.6, true)
	# coin
	ci.draw_circle(Vector2.ZERO, r, body, true, -1.0, true)
	ci.draw_circle(Vector2.ZERO, r, Toy.INK, false, 2.6, true)
	ci.draw_arc(Vector2.ZERO, r * 0.78, 0, TAU, 22, body.darkened(0.25), 2.0, true)
	_eyes(ci, Vector2(0, -r * 0.12), r * 0.22, r * 0.34, 0.25)
	ci.draw_arc(Vector2(0, r * 0.36), r * 0.3, 0.3, PI - 0.3, 10, Toy.INK, 2.0, true)

## WHALE — big, blue, blowing a spout, entirely unbothered.
func _draw_whale(ci: CanvasItem, body: Color) -> void:
	var r := radius
	# tail
	var tail := PackedVector2Array([
		Vector2(r * 0.7, -r * 0.1), Vector2(r * 1.35, -r * 0.6), Vector2(r * 1.2, 0.0),
		Vector2(r * 1.35, r * 0.5)])
	Toy.shape(ci, tail, body.darkened(0.12), Toy.INK, 2.2)
	# body
	Toy.shape(ci, Toy.ellipse(Vector2(-r * 0.1, 0), r * 1.05, r * 0.82, 24), body, Toy.INK, 2.6)
	ci.draw_colored_polygon(Toy.ellipse(Vector2(-r * 0.15, r * 0.4), r * 0.75, r * 0.3, 18),
		Color("#cfe4fb"))
	# spout
	for i in 3:
		var a := -PI * 0.5 + (float(i) - 1.0) * 0.4 + sin(t * 3.0) * 0.1
		ci.draw_line(Vector2(-r * 0.3, -r * 0.78), Vector2(-r * 0.3, -r * 0.78) + Vector2(cos(a), sin(a)) * r * 0.5,
			Color(0.8, 0.92, 1.0, 0.8), 3.0, true)
	_eyes(ci, Vector2(-r * 0.5, -r * 0.1), r * 0.16, r * 0.26, 0.2)
	ci.draw_arc(Vector2(-r * 0.15, r * 0.3), r * 0.55, 0.4, PI - 0.4, 14, Toy.INK, 2.2, true)

## ROCKET — cone, fins, window, flame. Flies at you.
func _draw_rocket(ci: CanvasItem, body: Color) -> void:
	var r := radius
	var flick := 0.7 + 0.3 * sin(t * 26.0)
	# flame
	var flame := PackedVector2Array([
		Vector2(r * 0.3, -r * 0.3), Vector2(r * (0.9 + 0.5 * flick), 0),
		Vector2(r * 0.3, r * 0.3)])
	Toy.shape(ci, flame, Color("#ffb03a"), Color("#ff6b2c"), 1.6)
	# fins
	for s in [-1.0, 1.0]:
		var fin := PackedVector2Array([
			Vector2(-r * 0.3, s * r * 0.42), Vector2(-r * 0.72, s * r * 0.95),
			Vector2(-r * 0.1, s * r * 0.78)])
		Toy.shape(ci, fin, Color("#e0556a"), Toy.INK, 2.0)
	# body
	Toy.shape(ci, Toy.round_rect(Rect2(-r * 0.75, -r * 0.52, r * 1.5, r * 1.04), r * 0.5), body, Toy.INK, 2.4)
	# nose cone
	var nose := PackedVector2Array([
		Vector2(-r * 0.75, -r * 0.5), Vector2(-r * 0.75, r * 0.5), Vector2(-r * 1.28, 0)])
	Toy.shape(ci, nose, Color("#e0556a"), Toy.INK, 2.2)
	# porthole + eye
	ci.draw_circle(Vector2(-r * 0.22, 0), r * 0.26, Color("#bfe9ff"), true, -1.0, true)
	ci.draw_circle(Vector2(-r * 0.22, 0), r * 0.26, Toy.INK, false, 2.0, true)
	ci.draw_circle(Vector2(-r * 0.28, 0), r * 0.11, Toy.INK, true, -1.0, true)

## REKT — a skull that hangs about and shoots.
func _draw_rekt(ci: CanvasItem, body: Color) -> void:
	var r := radius
	# floating bob
	var bob := sin(t * 2.2 + phase) * 3.0
	ci.draw_set_transform(Vector2(0, bob), 0.0, Vector2(1.18, 1.18))
	# cranium
	Toy.shape(ci, Toy.round_rect(Rect2(-r * 0.8, -r * 0.9, r * 1.6, r * 1.3), r * 0.5), body, Toy.INK, 2.4)
	# jaw
	Toy.shape(ci, Toy.round_rect(Rect2(-r * 0.52, r * 0.34, r * 1.04, r * 0.5), r * 0.2),
		body.darkened(0.08), Toy.INK, 2.0)
	# sockets
	for s in [-1.0, 1.0]:
		ci.draw_circle(Vector2(s * r * 0.34, -r * 0.18), r * 0.3, Toy.INK, true, -1.0, true)
		ci.draw_circle(Vector2(s * r * 0.34 + facing * r * 0.05, -r * 0.18), r * 0.12, Color("#ff5d73"), true, -1.0, true)
	# nose + teeth
	ci.draw_colored_polygon(PackedVector2Array([
		Vector2(0, r * 0.1), Vector2(-r * 0.12, r * 0.34), Vector2(r * 0.12, r * 0.34)]), Toy.INK)
	for i in 4:
		var x := -r * 0.42 + float(i) * r * 0.28
		ci.draw_line(Vector2(x, r * 0.38), Vector2(x, r * 0.72), Toy.INK, 2.0, true)
	ci.draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))

## NPC — grey, blank, with a question mark. Says nothing of substance.
func _draw_npc(ci: CanvasItem, body: Color) -> void:
	var r := radius
	Toy.shape(ci, Toy.round_rect(Rect2(-r * 0.5, r * 0.15, r, r * 0.95), r * 0.3), body.darkened(0.1), Toy.INK, 2.0)
	Toy.shape(ci, Toy.round_rect(Rect2(-r * 0.42, -r * 0.95, r * 0.84, r * 0.95), r * 0.36), body, Toy.INK, 2.2)
	# blank eyes: just two dark dots, no glints
	for s in [-1.0, 1.0]:
		ci.draw_circle(Vector2(s * r * 0.2, -r * 0.55), r * 0.1, Toy.INK, true, -1.0, true)
	ci.draw_line(Vector2(-r * 0.14, -r * 0.25), Vector2(r * 0.14, -r * 0.25), Toy.INK, 1.8, true)
	# the question mark it is always asking
	var q := "?"
	var font: Font = ThemeDB.fallback_font
	Toy.text(ci, Vector2(r * 0.62, -r * 1.05), q, 17, Color(0.95, 0.97, 1.0), HORIZONTAL_ALIGNMENT_CENTER, 3, Toy.INK)

## RUG — a rolled carpet that unrolls, with a fringe. Pulls itself out.
func _draw_rug(ci: CanvasItem, body: Color) -> void:
	var r := radius
	# the rug: a wide rounded slab with banding
	var slab := Rect2(-r, -r * 0.42, r * 2.0, r * 0.85)
	Toy.shape(ci, Toy.round_rect(slab, r * 0.22), body, Toy.INK, 2.4)
	for i in 3:
		var x := slab.position.x + r * 0.3 + float(i) * r * 0.55
		ci.draw_rect(Rect2(x, slab.position.y + r * 0.06, r * 0.16, slab.size.y - r * 0.12),
			body.lightened(0.25))
	# fringe on the leading edge
	for i in 5:
		var y := slab.position.y + r * 0.1 + float(i) * r * 0.16
		ci.draw_line(Vector2(slab.position.x - r * 0.08, y), Vector2(slab.position.x - r * 0.34, y),
			body.lightened(0.4), 2.2, true)
	# face on the roll
	_eyes(ci, Vector2(r * 0.1, -r * 0.06), r * 0.15, r * 0.3, 0.25)
	ci.draw_arc(Vector2(r * 0.12, r * 0.22), r * 0.2, PI + 0.3, TAU - 0.3, 8, Toy.INK, 1.8, true)
