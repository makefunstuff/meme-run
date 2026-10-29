extends Node2D
## One script for every enemy archetype.
##
## Each kind is a movement rule plus a silhouette. Keeping them in one file means
## the shared parts — hit flash, knockback, health bar, death payout, the label
## chip — exist once, and adding an archetype is a match branch rather than a
## scene and a script.

const Toy = preload("res://src/toy.gd")

signal killed(enemy)

const KINDS := {
	"walker":  {"hp": 2,  "r": 22.0, "speed": 90.0,  "label": "WALKER",  "coins": 2, "body": Toy.MINT,      "touch": 1},
	"flyer":   {"hp": 2,  "r": 19.0, "speed": 120.0, "label": "FLYER",   "coins": 2, "body": Toy.BLUE,      "touch": 1},
	"charger": {"hp": 3,  "r": 24.0, "speed": 70.0,  "label": "CHARGER", "coins": 3, "body": Toy.LILAC,     "touch": 1},
	"shooter": {"hp": 3,  "r": 22.0, "speed": 60.0,  "label": "SHOOTER", "coins": 3, "body": Toy.STEEL,     "touch": 1},
	"brute":   {"hp": 7,  "r": 34.0, "speed": 60.0,  "label": "BRUTE",   "coins": 5, "body": Toy.RED,       "touch": 2},
	"splitter":{"hp": 3,  "r": 25.0, "speed": 100.0, "label": "SPLITTER","coins": 3, "body": Toy.GOLD,      "touch": 1},
	"drifter": {"hp": 2,  "r": 20.0, "speed": 80.0,  "label": "DRIFTER", "coins": 2, "body": Toy.PINK_L,    "touch": 1},
}

var kind := "walker"
var data: Dictionary
var hp := 2
var max_hp := 2
var radius := 17.0
var vel := Vector2.ZERO
var phase := 0.0
var t := 0.0
var dead := false
var hit_flash := 0.0
var knock := Vector2.ZERO
var shoot_cd := 1.2
var charge_state := "idle"     ## charger: idle -> wind -> dash
var charge_t := 0.0
var spawn_t := 0.0
var blink := 0.0
var blink_cd := 1.5
var game: Node = null
var scale_factor := 1.0

func setup(g: Node, k: String, pos: Vector2, scale_mul: float = 1.0) -> void:
	game = g
	kind = k
	data = KINDS.get(k, KINDS["walker"])
	max_hp = int(data["hp"])
	hp = max_hp
	radius = float(data["r"]) * scale_mul
	scale_factor = scale_mul
	position = pos
	phase = randf() * TAU
	shoot_cd = randf_range(0.7, 1.8)
	blink_cd = randf_range(0.8, 3.0)
	# not every spawn barks: a wall of text on the right edge helps nobody
	if randf() < 0.45:
		game.say_event(kind + "_spawn", self, {"duration": 1.5, "cooldown": 99.0})

func _physics_process(delta: float) -> void:
	if dead:
		return
	t += delta
	hit_flash = maxf(0.0, hit_flash - delta * 5.0)
	spawn_t = minf(1.0, spawn_t + delta * 3.0)
	blink_cd -= delta
	if blink_cd <= 0.0:
		blink = 0.12
		blink_cd = randf_range(1.6, 4.5)
	blink = maxf(0.0, blink - delta)

	if game == null:
		return
	var player: Node2D = game.player
	if player == null or player.dead:
		_move(delta, null)
		return
	var to_player := player.global_position - global_position
	_move(delta, player)

	# knockback decay
	position += knock * delta
	knock = knock.lerp(Vector2.ZERO, delta * 7.0)

	# contact damage
	if to_player.length() < radius + 16.0:
		if player.hurt(global_position):
			pass
	queue_redraw()

func _move(delta: float, player: Node2D) -> void:
	var chase := Vector2.ZERO
	if player != null:
		chase = (player.global_position - global_position).normalized()
	match kind:
		"walker", "brute", "drifter":
			vel.x = move_toward(vel.x, -float(data["speed"]) * (1.0 if player == null else signf(chase.x) * -1.0 + 0.35), 300.0 * delta)
			vel.y = sin(t * 2.4 + phase) * 8.0
		"flyer":
			var target_y: float = player.global_position.y - 90.0 if player != null else position.y
			vel.y = move_toward(vel.y, clampf((target_y - position.y), -70.0, 70.0) * 1.6, 400.0 * delta)
			vel.x = move_toward(vel.x, -float(data["speed"]), 300.0 * delta)
		"shooter":
			# keep a firing distance: back off if too close, approach if too far
			var dist: float = absf(chase.x) if player != null else 400.0
			var want := 0.0
			if dist < 320.0:
				want = 90.0
			elif dist > 480.0:
				want = -70.0
			vel.x = move_toward(vel.x, want, 260.0 * delta)
			if shoot_cd <= 0.0 and player != null:
				shoot_cd = 1.9
				game.spawn_ebullet(global_position, (player.global_position - global_position).normalized() * 330.0)
			shoot_cd -= delta
		"charger":
			charge_t -= delta
			match charge_state:
				"idle":
					vel.x = move_toward(vel.x, -float(data["speed"]), 240.0 * delta)
					if charge_t <= 0.0 and player != null and absf(chase.x) < 460.0:
						charge_state = "wind"
						charge_t = 0.45
				"wind":
					vel.x = move_toward(vel.x, 0.0, 500.0 * delta)
					if charge_t <= 0.0 and player != null:
						charge_state = "dash"
						charge_t = 0.55
						vel = chase * 620.0
				"dash":
					if charge_t <= 0.0:
						charge_state = "idle"
						charge_t = 1.7
		"splitter":
			vel.x = move_toward(vel.x, -float(data["speed"]), 300.0 * delta)
			vel.y = sin(t * 3.0 + phase) * 26.0
	position += vel * delta

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
	# splitters break into two small walkers
	if kind == "splitter" and scale_factor > 0.7:
		for s in [-1.0, 1.0]:
			game.spawn_enemy("walker", global_position + Vector2(s * 18.0, 0), 0.72)
	killed.emit(self)
	queue_free()

func _draw() -> void:
	var body: Color = data["body"]
	if hit_flash > 0.02:
		body = body.lerp(Color.WHITE, hit_flash * 0.85)
	var pop := 0.6 + 0.4 * spawn_t     # squash in on spawn
	var r := radius
	var charging := kind == "charger" and charge_state == "wind"

	# ground shadow
	draw_circle(Vector2(0, r * 0.92), r * 0.9, Color(0.1, 0.05, 0.12, 0.28), true, -1.0, true)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2((2.0 - pop) * 1.22, pop * 1.22))

	match kind:
		"walker":
			Toy.body(self, Rect2(-r, -r * 0.9, r * 2, r * 1.8), r * 0.45, body, 2.2)
			for s in [-1.0, 1.0]:
				draw_line(Vector2(s * r * 0.45, r * 0.7), Vector2(s * r * 0.45, r * 1.1), Toy.INK, 5.0, true)
			Toy.eye_pair(self, Vector2(0, -r * 0.15), r * 0.26, r * 0.34)
			Toy.mouth(self, Vector2(0, r * 0.36), r * 0.5, r * 0.18, -0.4)
		"flyer":
			# wings flap with the phase, driven by sin so they never sync
			var flap := sin(t * 9.0 + phase) * 0.5
			for s in [-1.0, 1.0]:
				var tip := Vector2(s * (r * 1.7), -r * 0.2 + flap * r * 0.9)
				var wing := PackedVector2Array([Vector2(s * r * 0.5, -r * 0.2), tip, Vector2(s * r * 0.5, r * 0.4)])
				draw_colored_polygon(wing, body.lightened(0.2))
			Toy.blob(self, Vector2.ZERO, r, body, 2.2, 20)
			Toy.eye_pair(self, Vector2(0, -r * 0.1), r * 0.3, r * 0.34)
		"charger":
			var spikes := 9
			var pts := PackedVector2Array()
			for i in spikes * 2:
				var a := TAU * float(i) / float(spikes * 2) + t * (3.0 if charge_state == "dash" else 0.6)
				var rr := r * (1.28 if i % 2 == 0 else 0.86)
				pts.append(Vector2(cos(a), sin(a)) * rr)
			var col := body
			if charging:
				col = col.lerp(Color.WHITE, 0.45 + 0.45 * sin(t * 40.0))
			Toy.shape(self, pts, col, Toy.INK, 2.2)
			Toy.eye(self, Vector2(0, 0), r * 0.34, Vector2(0.2, 0.1))
		"shooter":
			Toy.body(self, Rect2(-r, -r * 0.85, r * 2, r * 1.7), 5.0, body, 2.2)
			# lens
			draw_circle(Vector2(r * 0.2, -r * 0.1), r * 0.42, Toy.DARK, true, -1.0, true)
			draw_circle(Vector2(r * 0.3, -r * 0.18), r * 0.2, Toy.RED, true, -1.0, true)
			draw_circle(Vector2(r * 0.2, -r * 0.1), r * 0.42, Toy.INK, false, 1.6, true)
			draw_line(Vector2(-r, -r * 0.6), Vector2(r * 0.6, -r * 0.6), Color(Toy.INK, 0.5), 2.0, true)
		"brute":
			Toy.body(self, Rect2(-r, -r * 1.05, r * 2, r * 2.1), r * 0.3, body, 2.6)
			for s in [-1.0, 1.0]:
				Toy.body(self, Rect2(s * r * 0.55 - r * 0.3, -r * 1.25, r * 0.6, r * 0.5), 4.0, body.darkened(0.15), 2.0)
			Toy.eye_pair(self, Vector2(0, -r * 0.2), r * 0.22, r * 0.4)
			# angry brows
			for s in [-1.0, 1.0]:
				draw_line(Vector2(s * r * 0.62, -r * 0.52), Vector2(s * r * 0.2, -r * 0.4), Toy.INK, 3.0, true)
			Toy.mouth(self, Vector2(0, r * 0.42), r * 0.6, r * 0.16, -0.8)
		"splitter":
			Toy.body(self, Rect2(-r, -r * 0.9, r * 2, r * 1.8), r * 0.62, body, 2.2)
			# a seam down the middle, so the split reads before it happens
			draw_line(Vector2(0, -r * 0.8), Vector2(0, r * 0.8), Color(Toy.INK, 0.55), 2.4, true)
			Toy.eye_pair(self, Vector2(0, -r * 0.1), r * 0.24, r * 0.42)
		"drifter":
			Toy.blob(self, Vector2.ZERO, r, body, 2.2, 18)
			for s in [-1.0, 1.0]:
				draw_line(Vector2(s * r * 0.9, r * 0.9), Vector2(s * r * 1.3, r * 1.5), Toy.INK, 2.0, true)
			Toy.eye_pair(self, Vector2(0, -r * 0.1), r * 0.22, r * 0.36)

	draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))

	# health bar for anything tougher than a basic unit
	if max_hp > 2:
		var w := r * 1.8
		var frac := clampf(float(hp) / float(max_hp), 0.0, 1.0)
		var y := -r * 1.45
		draw_rect(Rect2(-w * 0.5, y, w, 4), Color(0.1, 0.05, 0.12, 0.65))
		draw_rect(Rect2(-w * 0.5, y, w * frac, 4), Toy.MINT if frac > 0.5 else (Toy.GOLD if frac > 0.25 else Toy.RED))

	# label chip, only when close enough to read
	if game != null and game.labels_on:
		var player: Node2D = game.player
		if player != null and player.global_position.distance_to(global_position) < 420.0:
			var label: String = data["label"]
			var font := ThemeDB.fallback_font
			var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x
			var chip := Rect2(-tw * 0.5 - 6, -r * 1.45 - 18, tw + 12, 15)
			Toy.shape(self, Toy.round_rect(chip, 7.0), Color(0.99, 0.97, 0.95, 0.92), Toy.INK, 1.2)
			Toy.text(self, Vector2(-tw * 0.5, chip.position.y + 11.5), label, 11, Color("#6b4560"))
