extends Node2D
## Projectiles, both sides. One script: a bullet is a position, a velocity, a
## look and a collision rule, and both sides want all four.

const Toy = preload("res://src/toy.gd")

var vel := Vector2.ZERO
var friendly := true
var kind := "bolt"
var damage := 1
var life := 2.2
var radius := 6.0
var pierce := false
var homing := false
var blast := 0.0
var grow := false
var hole := false
var colour := Toy.BLUE_L
var t := 0.0
var trail: Array = []
var game: Node = null
var hits: Array = []
var knock := 60.0

func setup(g: Node, pos: Vector2, v: Vector2, w: Dictionary, is_friendly: bool) -> void:
	game = g
	position = pos
	vel = v
	friendly = is_friendly
	kind = w.get("kind", "bolt")
	damage = int(w.get("dmg", 1))
	pierce = bool(w.get("pierce", false))
	homing = bool(w.get("homing", false))
	blast = float(w.get("blast", 0.0))
	grow = bool(w.get("grow", false))
	hole = bool(w.get("hole", false))
	knock = float(w.get("knock", 60.0))
	match kind:
		"bolt": colour = Toy.BLUE_L; radius = 6.0
		"laser": colour = Toy.BLUE; radius = 5.0
		"orb": colour = Toy.LILAC; radius = 11.0
		"rocket": colour = Toy.PINK_L; radius = 8.0
		"crumb": colour = Color("#e8b072"); radius = 5.0
		"crew": colour = Toy.RED; radius = 9.0
		"coin": colour = Toy.GOLD; radius = 6.0
		"pump": colour = Toy.MINT; radius = 9.0
		"lever": colour = Toy.BLUE; radius = 7.0
		"enemy": colour = Toy.RED; radius = 8.0
		_: colour = Toy.WHITE

func _exit_tree() -> void:
	if game != null:
		if friendly:
			game.bullets.erase(self)
		else:
			game.ebullets.erase(self)

func _physics_process(delta: float) -> void:
	t += delta
	life -= delta
	if life <= 0.0:
		queue_free()
		return

	if homing and friendly and game != null:
		var target: Node2D = null
		var best := 1e9
		for e in game.enemies:
			if not is_instance_valid(e) or e.dead:
				continue
			var d: float = e.global_position.distance_squared_to(global_position)
			if d < best:
				best = d
				target = e
		if target != null:
			var want: Vector2 = (target.global_position - global_position).normalized() * vel.length()
			vel = vel.lerp(want, clampf(delta * 4.0, 0.0, 1.0))

	if grow:
		radius = minf(radius + delta * 26.0, 26.0)

	# only the heavy rounds get a smear; 7 circles per bolt was pure cost
	if kind in ["orb", "rocket", "pump", "crew"]:
		trail.append(global_position)
		if trail.size() > 5:
			trail.pop_front()

	position += vel * delta

	if game != null:
		if friendly:
			_check_enemies()
		else:
			_check_player()
	queue_redraw()

func _check_enemies() -> void:
	for e in game.enemies:
		if not is_instance_valid(e) or e.dead or e in hits:
			continue
		if e.global_position.distance_to(global_position) < e.radius + radius:
			hits.append(e)
			var killed: bool = e.apply_hit(damage, vel)
			game.emit_fx("hit", global_position, {"dir": vel, "colour": colour})
			if blast > 0.0:
				game.explode(global_position, blast, damage)
				queue_free()
				return
			if not pierce:
				queue_free()
				return

func _check_player() -> void:
	var p: Node2D = game.player
	if p == null or p.dead:
		return
	if p.global_position.distance_to(global_position) < 16.0 + radius:
		if p.hurt(global_position):
			pass
		queue_free()

func _draw() -> void:
	# trail smear
	for i in trail.size():
		var f := float(i) / float(max(1, trail.size()))
		var p := to_local(trail[i])
		draw_circle(p, radius * (0.35 + f * 0.5), Color(colour.r, colour.g, colour.b, 0.06 + f * 0.16), true, -1.0, true)

	match kind:
		"laser", "lever":
			var d := vel.normalized()
			var p1 := -d * 16.0
			var p2 := d * 14.0
			draw_line(p1, p2, Color(1, 1, 1, 0.85), radius * 1.6, true)
			draw_line(p1, p2, colour, radius * 0.8, true)
			Toy.glow(self, Vector2.ZERO, radius * 4.0, colour, 0.5)
		"rocket":
			Toy.glow(self, -vel.normalized() * 8.0, 16.0, Color(1.0, 0.6, 0.2), 0.7)
			Toy.body(self, Rect2(-radius, -radius * 0.7, radius * 2.0, radius * 1.4), 3.5, Toy.STEEL, 1.8)
			draw_circle(Vector2(radius * 0.4, 0), radius * 0.4, colour, true, -1.0, true)
		"orb":
			Toy.glow(self, Vector2.ZERO, radius * 3.2, Toy.LILAC_D, 0.6)
			Toy.blob(self, Vector2.ZERO, radius, Toy.DARK, 2.0, 16)
			draw_circle(Vector2.ZERO, radius * 0.55, colour, true, -1.0, true)
			draw_arc(Vector2.ZERO, radius * 1.25, t * 4.0, t * 4.0 + 4.4, 16, Toy.LILAC, 2.0, true)
		"crumb":
			draw_circle(Vector2.ZERO, radius, colour, true, -1.0, true)
			draw_circle(Vector2(-radius * 0.3, -radius * 0.3), radius * 0.35, colour.lightened(0.4), true, -1.0, true)
		"crew":
			Toy.blob(self, Vector2.ZERO, radius, Toy.RED, 1.8, 14)
			draw_rect(Rect2(-radius * 0.55, -radius * 0.3, radius * 1.1, radius * 0.55), Toy.BLUE_L)
		"coin":
			draw_circle(Vector2.ZERO, radius, Toy.GOLD, true, -1.0, true)
			draw_arc(Vector2.ZERO, radius * 0.7, 0, TAU, 12, Toy.GOLD_D, 1.6, true)
		"enemy":
			# reads as a hazard, not a character: spiked, hot, and rotating
			Toy.glow(self, Vector2.ZERO, radius * 3.0, Toy.RED, 0.7)
			var spikes := PackedVector2Array()
			for i in 8:
				var ang := t * 6.0 + TAU * float(i) / 8.0
				var rr := radius * (1.5 if i % 2 == 0 else 0.7)
				spikes.append(Vector2(cos(ang), sin(ang)) * rr)
			Toy.shape(self, spikes, Toy.RED, Color("#5c1020"), 1.6)
			draw_circle(Vector2.ZERO, radius * 0.42, Color(1, 0.95, 0.9), true, -1.0, true)
		"pump":
			Toy.glow(self, Vector2.ZERO, radius * 2.2, Toy.MINT, 0.5)
			Toy.blob(self, Vector2.ZERO, radius, Toy.MINT_D, 2.0, 14)
			draw_circle(Vector2.ZERO, radius * 0.4, Toy.CREAM, true, -1.0, true)
		_:
			var d2 := vel.normalized()
			var q1 := -d2 * 12.0
			var q2 := d2 * 10.0
			draw_line(q1, q2, Color(1, 1, 1, 0.9), radius * 1.5, true)
			draw_line(q1, q2, colour, radius * 0.7, true)
			Toy.glow(self, Vector2.ZERO, radius * 3.0, colour, 0.45)
