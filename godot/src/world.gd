extends Node2D
## The backdrop: sky, sun, clouds, three parallax ridges, the stage floor and its
## soil. It is added to a CanvasLayer by game.gd, so it is screen-anchored and
## the camera never drags it around; parallax is applied by hand from `scroll`.
## (It cannot BE the CanvasLayer: CanvasLayer is not a CanvasItem and therefore
## cannot draw.)

const Toy = preload("res://src/toy.gd")

var scroll := 0.0            ## how far the camera has travelled, in world px
var mode := "classic"        ## classic / degen / chaos / ohio
var t := 0.0
var ground_y := 560.0
var view := Vector2(1280, 720)

## Per-mode lighting: the same baked shapes re-tinted, so a mode change is a
## world change and not a filter slapped over the screen.
const PALETTES := {
	"classic": {
		"sky_top": Color("#2f7fd0"), "sky_mid": Color("#63aeee"), "sky_low": Color("#cfe7fb"),
		"horizon": Color("#ffd9e6"), "ridge": [Color("#9ad3f2"), Color("#77bfe0"), Color("#5aa87f")],
		"ridge_line": [Color("#d6f0ff"), Color("#bfe8f8"), Color("#a8e6bd")],
		"soil": Color("#6b4633"), "soil_deep": Color("#2b1c24"),
		"grass": Color("#7fd06a"), "grass_lit": Color("#c8f08e"),
		"sun": Color("#ffe27a"), "cloud": Color("#fffaf9"),
		"tint": Color(1, 1, 1),
	},
	"degen": {
		"sky_top": Color("#04170f"), "sky_mid": Color("#0b3a22"), "sky_low": Color("#1f7d43"),
		"horizon": Color("#63e08a"), "ridge": [Color("#12603a"), Color("#0d4a2c"), Color("#1b8a4e")],
		"ridge_line": [Color("#4bf08a"), Color("#39d474"), Color("#8cf7b0")],
		"soil": Color("#12321f"), "soil_deep": Color("#06120b"),
		"grass": Color("#37c46a"), "grass_lit": Color("#a6f7c0"),
		"sun": Color("#9dffc0"), "cloud": Color("#d8ffe8"),
		"tint": Color(0.9, 1.08, 0.94),
	},
	"chaos": {
		"sky_top": Color("#4a1f5e"), "sky_mid": Color("#a8356a"), "sky_low": Color("#ffb066"),
		"horizon": Color("#ffd9a0"), "ridge": [Color("#8c3a72"), Color("#653059"), Color("#3f2348")],
		"ridge_line": [Color("#ffb08c"), Color("#ff8f7a"), Color("#d2668f")],
		"soil": Color("#4a2530"), "soil_deep": Color("#1d0f18"),
		"grass": Color("#c2622f"), "grass_lit": Color("#ffb066"),
		"sun": Color("#ffcf5c"), "cloud": Color("#ffd9c2"),
		"tint": Color(1.06, 0.99, 0.95),
	},
	"ohio": {
		"sky_top": Color("#120a2c"), "sky_mid": Color("#4d1f7a"), "sky_low": Color("#c2408e"),
		"horizon": Color("#ff8fc0"), "ridge": [Color("#54227e"), Color("#3c1a5e"), Color("#26123f")],
		"ridge_line": [Color("#ff6fd0"), Color("#e05ac0"), Color("#a03aa8")],
		"soil": Color("#2a1230"), "soil_deep": Color("#0d0714"),
		"grass": Color("#a8339c"), "grass_lit": Color("#ff8fe0"),
		"sun": Color("#ff7ad0"), "cloud": Color("#ffd6f4"),
		"tint": Color(1.04, 0.94, 1.08),
	},
}

var pal: Dictionary

func _ready() -> void:
	pal = PALETTES["classic"]

func set_mode(m: String) -> void:
	mode = m
	pal = PALETTES.get(m, PALETTES["classic"])
	queue_redraw()

## Deterministic ridge height. Sum of sines with irrational-ish ratios: cheap,
## seamless when sampled modulo the period, and never repeats visibly.
func _ridge(x: float, period: float, amp: float, phase: float) -> float:
	var k := TAU / period
	return -(sin(x * k + phase) * amp
		+ sin(x * k * 2.13 + phase * 1.7) * amp * 0.42
		+ sin(x * k * 4.37 + phase * 2.9) * amp * 0.16)

func _process(delta: float) -> void:
	t += delta
	view = get_viewport().get_visible_rect().size
	ground_y = view.y * 0.82
	queue_redraw()

func _draw() -> void:
	if pal.is_empty():
		return
	_draw_sky()
	_draw_sun()
	_draw_clouds()
	_draw_ridges()
	_draw_props()
	_draw_ground()

# ------------------------------------------------------------------- sky ----

func _draw_sky() -> void:
	var w := view.x
	var h := ground_y + 40.0
	# three-stop gradient, drawn as one polygon with per-vertex colour
	var band := 24
	var pts := PackedVector2Array()
	var cols := PackedColorArray()
	for i in band + 1:
		var f := float(i) / float(band)
		var y := f * h
		pts.append(Vector2(0, y)); cols.append(_sky_at(f))
		pts.append(Vector2(w, y)); cols.append(_sky_at(f))
	# build as horizontal strips so the gradient interpolates vertically only
	for i in band:
		var y0 := h * float(i) / float(band)
		var y1 := h * float(i + 1) / float(band)
		var quad := PackedVector2Array([Vector2(0, y0), Vector2(w, y0), Vector2(w, y1), Vector2(0, y1)])
		var quad_cols := PackedColorArray([
			_sky_at(float(i) / band), _sky_at(float(i) / band),
			_sky_at(float(i + 1) / band), _sky_at(float(i + 1) / band)])
		draw_polygon(quad, quad_cols)

func _sky_at(f: float) -> Color:
	var top: Color = pal["sky_top"]
	var mid: Color = pal["sky_mid"]
	var low: Color = pal["sky_low"]
	var hor: Color = pal["horizon"]
	if f < 0.45:
		return top.lerp(mid, f / 0.45)
	elif f < 0.8:
		return mid.lerp(low, (f - 0.45) / 0.35)
	return low.lerp(hor, (f - 0.8) / 0.2)

# ------------------------------------------------------------------- sun ----

func _draw_sun() -> void:
	var pos := Vector2(view.x * 0.84, view.y * 0.15)
	var r := clampf(view.y * 0.075, 42.0, 78.0)
	var c: Color = pal["sun"]
	# rays behind, slowly turning
	for i in 12:
		var a := t * 0.12 + TAU * float(i) / 12.0
		var inner := pos + Vector2(cos(a), sin(a)) * (r * 1.35)
		var outer := pos + Vector2(cos(a), sin(a)) * (r * (1.9 + 0.18 * sin(t * 1.3 + i)))
		draw_line(inner, outer, Color(c.r, c.g, c.b, 0.5), max(2.0, r * 0.09), true)
	Toy.glow(self, pos, r * 3.2, c, 0.5)
	draw_circle(pos, r, c, true, -1.0, true)
	draw_circle(pos, r, Color(1, 1, 1, 0.18), true, -1.0, true)
	# shades, because the sun is one of the characters
	var off := r * 0.34
	for s in [-1.0, 1.0]:
		var lens := Rect2(pos + Vector2(s * off - r * 0.19, -r * 0.12), Vector2(r * 0.38, r * 0.24))
		draw_colored_polygon(Toy.round_rect(lens, r * 0.11), Color("#2b1d22"))
	Toy.mouth(self, pos + Vector2(0, r * 0.34), r * 0.5, r * 0.16, 0.8, Color("#c97b2f"))

# ---------------------------------------------------------------- clouds ----

func _draw_clouds() -> void:
	var c: Color = pal["cloud"]
	for layer in [[0.06, 3, 0.55, 150.0], [0.13, 4, 0.8, 260.0], [0.22, 3, 1.1, 380.0]]:
		var factor: float = layer[0]
		var count: int = layer[1]
		var scale: float = layer[2]
		var spread: float = layer[3]
		var period: float = view.x + spread * 2.0
		for i in count:
			var seed := float(i) * 37.7 + factor * 100.0
			var x: float = fposmod(seed * 53.0 - scroll * factor, period) - spread
			var y := view.y * (0.10 + 0.24 * fposmod(seed * 0.11, 1.0))
			_draw_cloud(Vector2(x, y + sin(t * 0.3 + seed) * 3.0), scale * (0.8 + 0.4 * fposmod(seed, 1.0)), c)

func _draw_cloud(pos: Vector2, s: float, c: Color) -> void:
	var lumps := [
		[Vector2(-26, 6), 20.0], [Vector2(0, -4), 26.0], [Vector2(28, 5), 19.0],
		[Vector2(6, 12), 22.0], [Vector2(-14, 12), 16.0],
	]
	# shade underneath so it sits in the air
	for l in lumps:
		draw_circle(pos + Vector2(l[0]) * s + Vector2(0, 3.0 * s), l[1] * s * 0.96, Color(c.r * 0.78, c.g * 0.78, c.b * 0.86, 0.5), true, -1.0, true)
	for l in lumps:
		draw_circle(pos + Vector2(l[0]) * s, l[1] * s, c, true, -1.0, true)
	# a face, because this world has one
	draw_circle(pos + Vector2(-8, 2) * s, 2.6 * s, Color("#7a5a6c"), true, -1.0, true)
	draw_circle(pos + Vector2(8, 2) * s, 2.6 * s, Color("#7a5a6c"), true, -1.0, true)
	draw_arc(pos + Vector2(0, 7) * s, 7.0 * s, 0.35, PI - 0.35, 8, Color("#7a5a6c"), max(1.2, 1.8 * s), true)

# ---------------------------------------------------------------- ridges ----

func _draw_ridges() -> void:
	# [parallax factor, wavelength, amplitude, height above the floor, palette index]
	var layers := [
		[0.12, 340.0, 42.0, 96.0, 0],
		[0.24, 260.0, 34.0, 58.0, 1],
		[0.42, 420.0, 26.0, 22.0, 2],
	]
	for l in layers:
		var factor: float = l[0]
		var period: float = l[1]
		var amp: float = l[2]
		var base: float = ground_y - l[3]
		var idx: int = l[4]
		var step := 18.0
		var pts := PackedVector2Array()
		pts.append(Vector2(-40, ground_y + 60))
		var x := -40.0
		while x <= view.x + 40.0:
			pts.append(Vector2(x, base + _ridge(x + scroll * factor, period, amp, float(idx) * 2.1)))
			x += step
		pts.append(Vector2(view.x + 40, ground_y + 60))
		var body: Color = pal["ridge"][idx]
		Toy.grad_shape(self, pts, body.lightened(0.16), body.darkened(0.18))
		# lit ridge line
		var line := PackedVector2Array()
		var x2 := -40.0
		while x2 <= view.x + 40.0:
			line.append(Vector2(x2, base + _ridge(x2 + scroll * factor, period, amp, float(idx) * 2.1)))
			x2 += step
		draw_polyline(line, pal["ridge_line"][idx], 2.0, true)

# ----------------------------------------------------------------- props ----

const PROP_WORDS := ["NO CAP", "SO MID", "1:1", "RATIO", "WAGMI", "REKT", "HODL", "FUD"]

func _draw_props() -> void:
	var factor := 0.55
	var spacing := 640.0
	var period := view.x + 600.0
	var count := int(period / spacing) + 1
	for i in count:
		var seed := float(i) * 71.3
		var x := fposmod(seed * 31.0 - scroll * factor, period) - 300.0
		var base := ground_y - 2.0
		if fposmod(seed * 0.07, 1.0) > 0.55:
			# billboard on a post
			var word: String = PROP_WORDS[int(abs(seed)) % PROP_WORDS.size()]
			var w2 := 92.0
			var h2 := 40.0
			var top := base - 118.0
			draw_line(Vector2(x, base), Vector2(x, top + h2 * 0.5), Color("#6b4a35"), 4.0)
			var board := Rect2(x - w2 * 0.5, top - h2 * 0.5, w2, h2)
			Toy.shape(self, Toy.round_rect(board, 8.0), Color("#fff3e2"), Color("#5a3a48"), 2.0)
			Toy.text(self, Vector2(x, top + 4.0), word, 13, Color("#c9436a"), HORIZONTAL_ALIGNMENT_CENTER)
		else:
			# a monument silhouette, so the mid distance has landmarks
			var h3 := 46.0 + fposmod(seed * 0.13, 1.0) * 52.0
			var col := Color(pal["ridge"][2]).darkened(0.15)
			var pts := PackedVector2Array([
				Vector2(x - 22.0, base), Vector2(x - 16.0, base - h3 * 0.7),
				Vector2(x, base - h3), Vector2(x + 16.0, base - h3 * 0.7),
				Vector2(x + 22.0, base)])
			draw_colored_polygon(pts, Color(col.r, col.g, col.b, 0.65))

# ---------------------------------------------------------------- ground ----

func _draw_ground() -> void:
	var w := view.x
	var h := view.y
	# soil body
	var soil: Color = pal["soil"]
	var deep: Color = pal["soil_deep"]
	var pts := PackedVector2Array([
		Vector2(0, ground_y), Vector2(w, ground_y), Vector2(w, h), Vector2(0, h)])
	Toy.grad_shape(self, pts, soil, deep)

	# lit crust directly under the turf
	draw_rect(Rect2(0, ground_y + 18.0, w, 10.0), Color(soil.lightened(0.28), 0.55))
	draw_rect(Rect2(0, ground_y + 28.0, w, 5.0), Color(soil.lightened(0.16), 0.35))

	# strata: polylines that scroll slowly, so the ground reads as depth
	for i in 6:
		var y0 := ground_y + 26.0 + float(i) * (h - ground_y) * 0.19
		var line := PackedVector2Array()
		var x := -20.0
		while x <= w + 20.0:
			var yy := y0 + sin((x + scroll * 0.86) * 0.006 + float(i) * 1.7) * 7.0
			line.append(Vector2(x, yy))
			x += 24.0
		var lit := Color(soil.lightened(0.30 + 0.05 * float(i)), 0.62 - 0.08 * float(i))
		draw_polyline(line, lit, 2.4 + float(i) * 0.5, true)

	# the floor falls away into shadow, so the eye stays on the action
	var vign := PackedVector2Array([
		Vector2(0, h * 0.62), Vector2(w, h * 0.62), Vector2(w, h), Vector2(0, h)])
	var vcols := PackedColorArray([
		Color(deep, 0.0), Color(deep, 0.0), Color(deep, 0.85), Color(deep, 0.85)])
	draw_polygon(vign, vcols)

	# buried debris
	for i in 18:
		var seed := float(i) * 91.3
		var x: float = fposmod(seed * 13.0 - scroll * 0.9, w + 120.0) - 60.0
		var y := ground_y + 30.0 + fposmod(seed * 7.1, 1.0) * (h - ground_y - 40.0)
		var r := 3.0 + fposmod(seed * 3.3, 1.0) * 6.0
		draw_circle(Vector2(x, y), r, Color(deep.lightened(0.35), 0.45), true, -1.0, true)

	# grass edge: a lit lip, then tufts on top
	var grass: Color = pal["grass"]
	var lit: Color = pal["grass_lit"]
	draw_rect(Rect2(0, ground_y, w, 18.0), grass)
	draw_rect(Rect2(0, ground_y, w, 4.0), lit)
	draw_rect(Rect2(0, ground_y + 16.0, w, 4.0), Color(deep, 0.6))
	var x := -10.0
	while x <= w + 10.0:
		var seed: float = floorf((x + scroll) / 13.0)
		var h1: float = fposmod(seed * 0.37, 1.0)
		if h1 > 0.55:
			var bx: float = x + h1 * 8.0
			var bh: float = 5.0 + h1 * 9.0
			var sway := sin(t * 1.6 + seed) * 2.2
			var blade := PackedVector2Array([
				Vector2(bx - 2, ground_y + 1), Vector2(bx + 2, ground_y + 1),
				Vector2(bx + sway, ground_y - bh)])
			draw_colored_polygon(blade, lit)
		x += 13.0
