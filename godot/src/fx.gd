extends Node2D
## All transient visual noise: sparks, debris, rings, floating text.
##
## One node owns every particle and draws them in a single pass. Pooling was not
## worth it — the arrays are capped and the whole thing is well under a
## millisecond — but a hundred separate nodes would not be.

const Toy = preload("res://src/toy.gd")

const MAX_PARTS := 420

var parts: Array = []
var texts: Array = []
var rings: Array = []

func burst(pos: Vector2, count: int, colour: Color, speed: float = 260.0, size: float = 4.0,
		life: float = 0.6, gravity: float = 900.0, spread: float = TAU, dir: float = 0.0) -> void:
	for i in count:
		if parts.size() >= MAX_PARTS:
			break
		var a := dir + randf_range(-spread * 0.5, spread * 0.5)
		var sp := speed * randf_range(0.35, 1.0)
		parts.append({
			"pos": pos, "vel": Vector2(cos(a), sin(a)) * sp,
			"life": life * randf_range(0.6, 1.0), "max": life,
			"size": size * randf_range(0.6, 1.4), "colour": colour,
			"gravity": gravity, "spin": randf_range(-8.0, 8.0), "rot": randf() * TAU,
		})

func ring(pos: Vector2, r0: float, r1: float, colour: Color, life: float = 0.4, width: float = 3.0) -> void:
	rings.append({"pos": pos, "r0": r0, "r1": r1, "life": life, "max": life, "colour": colour, "width": width})

func text(pos: Vector2, s: String, colour: Color, size: int = 18, vel: Vector2 = Vector2(0, -60)) -> void:
	texts.append({"pos": pos, "s": s, "colour": colour, "size": size, "vel": vel,
		"life": 0.9, "max": 0.9})

func _process(delta: float) -> void:
	for p in parts:
		p["life"] -= delta
		p["vel"] += Vector2(0, p["gravity"]) * delta
		p["vel"] *= 1.0 - minf(delta * 1.6, 0.5)
		p["pos"] += p["vel"] * delta
		p["rot"] += p["spin"] * delta
	parts = parts.filter(func(p): return p["life"] > 0.0)

	for x in texts:
		x["life"] -= delta
		x["pos"] += x["vel"] * delta
		x["vel"] *= 1.0 - minf(delta * 3.0, 0.6)
	texts = texts.filter(func(x): return x["life"] > 0.0)

	for r in rings:
		r["life"] -= delta
	rings = rings.filter(func(r): return r["life"] > 0.0)

	queue_redraw()

func _draw() -> void:
	Toy.sticker = false
	for r in rings:
		var f: float = 1.0 - r["life"] / r["max"]
		var radius: float = lerpf(r["r0"], r["r1"], f)
		var c: Color = r["colour"]
		draw_arc(r["pos"], radius, 0, TAU, 28, Color(c.r, c.g, c.b, c.a * (1.0 - f)), r["width"], true)

	for p in parts:
		var a: float = clampf(p["life"] / p["max"], 0.0, 1.0)
		var c: Color = p["colour"]
		var sz: float = p["size"] * (0.4 + a * 0.6)
		if sz < 1.2:
			continue
		# squares read as debris, circles as sparks: mixing both stops bursts
		# from looking like one uniform puff
		if int(p["spin"] * 10.0) % 3 == 0:
			draw_circle(p["pos"], sz, Color(c.r, c.g, c.b, a), true, -1.0, true)
		else:
			var pts := PackedVector2Array()
			for i in 4:
				var ang: float = p["rot"] + TAU * float(i) / 4.0 + PI * 0.25
				pts.append(p["pos"] + Vector2(cos(ang), sin(ang)) * sz * 1.3)
			draw_colored_polygon(pts, Color(c.r, c.g, c.b, a))

	for x in texts:
		var a2: float = clampf(x["life"] / x["max"], 0.0, 1.0)
		var c2: Color = x["colour"]
		var font := ThemeDB.fallback_font
		var w := font.get_string_size(x["s"], HORIZONTAL_ALIGNMENT_LEFT, -1, x["size"]).x
		var pos: Vector2 = x["pos"] - Vector2(w * 0.5, 0)
		draw_string_outline(font, pos, x["s"], HORIZONTAL_ALIGNMENT_LEFT, -1, x["size"], 4,
			Color(0.11, 0.07, 0.13, a2))
		draw_string(font, pos, x["s"], HORIZONTAL_ALIGNMENT_LEFT, -1, x["size"], Color(c2.r, c2.g, c2.b, a2))
