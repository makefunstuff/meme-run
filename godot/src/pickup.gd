extends Node2D
## Pickups. Coins and gems are the economy, hearts are health, crates are guns.
## Everything except hearts is magnetised once you get close, because a runner
## where you have to steer into every coin is a chore.

const Toy = preload("res://src/toy.gd")

var kind := "coin"
var value := 1
var weapon := ""
var t := 0.0
var vel := Vector2.ZERO
var magnet := false
var collected := false
var game: Node = null
var base_y := 0.0
var glow_colour := Toy.GOLD

func setup(g: Node, k: String, pos: Vector2, extra: Dictionary = {}) -> void:
	game = g
	kind = k
	position = pos
	base_y = pos.y
	value = int(extra.get("value", 1))
	weapon = String(extra.get("weapon", ""))
	vel = Vector2(randf_range(-40, 40), randf_range(-260, -140))
	match kind:
		"coin": glow_colour = Toy.GOLD
		"gem": glow_colour = Toy.PINK
		"heart": glow_colour = Toy.RED
		"crate": glow_colour = Toy.MINT
		"shield": glow_colour = Toy.BLUE
	t = randf() * TAU

func _physics_process(delta: float) -> void:
	if collected:
		return
	t += delta
	if game == null or game.player == null:
		return
	var p: Node2D = game.player

	# settle: a little arc on spawn, then hover
	if not magnet:
		vel.y += 700.0 * delta
		vel.x = move_toward(vel.x, 0.0, 220.0 * delta)
		position += vel * delta
		if position.y > base_y + 220.0:
			position.y = base_y + 220.0
			vel.y = 0.0
		if position.y >= game.ground_y - 14.0:
			position.y = game.ground_y - 14.0
			vel = Vector2.ZERO
		if p.global_position.distance_to(global_position) < 120.0:
			magnet = true
	else:
		var dir := (p.global_position - global_position)
		var dist := dir.length()
		if dist < 26.0:
			_collect()
			return
		position += dir.normalized() * (240.0 + (120.0 - minf(dist, 120.0)) * 4.0) * delta
	queue_redraw()

func _collect() -> void:
	collected = true
	if game != null:
		game.on_pickup(self)
	queue_free()

func _draw() -> void:
	Toy.sticker = true
	Toy.sticker_pad = 2.5
	var bob := sin(t * 3.0 + base_y) * 3.0
	var glow_a := 0.5 + 0.2 * sin(t * 5.0)
	Toy.glow(self, Vector2(0, bob), 26.0, glow_colour, glow_a * 0.8)
	match kind:
		"coin":
			var w := 11.0 * absf(cos(t * 2.6))
			draw_colored_polygon(Toy.ellipse(Vector2(0, bob), maxf(3.0, w), 11.0, 16), Toy.GOLD)
			draw_arc(Vector2(0, bob), 11.0, 0, TAU, 18, Toy.INK, 2.0, true)
			draw_arc(Vector2(0, bob), 7.0, 0, TAU, 16, Toy.GOLD_D, 1.6, true)
		"gem":
			var pts := PackedVector2Array([
				Vector2(0, bob - 13), Vector2(11, bob - 2), Vector2(0, bob + 14), Vector2(-11, bob - 2)])
			Toy.shape(self, pts, Toy.PINK, Toy.INK, 2.0)
			draw_colored_polygon(PackedVector2Array([
				Vector2(0, bob - 13), Vector2(6, bob - 2), Vector2(-6, bob - 2)]), Color(1, 1, 1, 0.45))
		"heart":
			Toy.heart(self, Vector2(0, bob), 13.0, Toy.RED)
		"shield":
			var pts := PackedVector2Array([
				Vector2(-10, bob - 10), Vector2(10, bob - 10), Vector2(10, bob + 3),
				Vector2(0, bob + 14), Vector2(-10, bob + 3)])
			Toy.shape(self, pts, Toy.BLUE, Toy.INK, 2.0)
			Toy.sparkle(self, Vector2(0, bob + 1), 6.0, Color(1, 1, 1, 0.8))
		"crate":
			Toy.body(self, Rect2(-14, bob - 14, 28, 28), 6.0, Toy.MINT, 2.2)
			var label := weapon.substr(0, 1).to_upper()
			var font := ThemeDB.fallback_font
			var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x
			Toy.text(self, Vector2(-tw * 0.5, bob + 6), label, 16, Toy.INK)
			Toy.sparkle(self, Vector2(9, bob - 11), 5.0, Color(1, 1, 1, 0.9))
	Toy.sticker = false
