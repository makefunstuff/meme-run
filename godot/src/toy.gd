extends RefCounted
class_name Toy

## Shared drawing vocabulary for the whole game.
##
## Nothing in this project uses imported art. Every character, pickup and
## background element is drawn from arcs, rounded rectangles and polygons, which
## keeps the file size tiny (it has to fit on GitHub Pages), keeps the shapes
## crisp at any resolution, and means one palette change re-skins the game.
##
## The house style, borrowed deliberately from toy plastic:
##   * ink outline on every silhouette, sized relative to the shape
##   * a lit top edge and a darker underside band, not a gradient
##   * one highlight blob, even though nothing is actually lit
##   * faces are two dots and a curve, and the eyes are always too big

const INK      := Color("#1d1120")
const INK_SOFT := Color("#3a2340")

const PINK     := Color("#ff5d73")
const PINK_D   := Color("#e0476a")
const PINK_L   := Color("#ffd3e2")
const SKIN     := Color("#f2cda6")
const SKIN_D   := Color("#d8a97e")
const GOLD     := Color("#ffd166")
const GOLD_D   := Color("#d9982f")
const MINT     := Color("#7fd3a8")
const MINT_D   := Color("#43a86c")
const LILAC    := Color("#c9a8e8")
const LILAC_D  := Color("#8f63bd")
const BLUE     := Color("#6fb7ff")
const BLUE_L   := Color("#bfe9ff")
const RED      := Color("#ff5d73")
const CREAM    := Color("#fff3e2")
const WHITE    := Color("#fffaf9")
const STEEL    := Color("#c6cede")
const STEEL_D  := Color("#8e9bb0")
const DARK     := Color("#22131f")
const GREY     := Color("#93a6c0")

static var _arc_cache: Dictionary = {}

## When true, every filled shape gets a white border under its ink outline, which
## makes a character read as a die-cut sticker against a busy background. Toggled
## around character drawing only, so the world keeps its own line weights.
static var sticker := false
static var sticker_colour := Color("#fffdff")
static var sticker_pad := 4.0

# ---------------------------------------------------------------- geometry --

## Points around an ellipse. Cached per (rx, ry, segments) because every hopper
## in the game asks for the same handful of circles every frame.
static func ellipse(centre: Vector2, rx: float, ry: float, seg: int = 20) -> PackedVector2Array:
	var key := "%0.1f_%0.1f_%d" % [rx, ry, seg]
	var base: PackedVector2Array
	if _arc_cache.has(key):
		base = _arc_cache[key]
	else:
		base = PackedVector2Array()
		for i in seg:
			var a := TAU * float(i) / float(seg)
			base.append(Vector2(cos(a) * rx, sin(a) * ry))
		_arc_cache[key] = base
	var out := PackedVector2Array()
	out.resize(base.size())
	for i in base.size():
		out[i] = centre + base[i]
	return out


static func circle(centre: Vector2, r: float, seg: int = 20) -> PackedVector2Array:
	return ellipse(centre, r, r, seg)


## Rounded rectangle, corners only — a squircle reads more like moulded plastic
## than a true arc does at these sizes.
static func round_rect(rect: Rect2, radius: float, seg: int = 6) -> PackedVector2Array:
	var r: float = min(radius, min(rect.size.x, rect.size.y) * 0.5)
	var pts := PackedVector2Array()
	var corners := [
		[Vector2(rect.position.x + rect.size.x - r, rect.position.y + r), -PI * 0.5],
		[Vector2(rect.position.x + rect.size.x - r, rect.position.y + rect.size.y - r), 0.0],
		[Vector2(rect.position.x + r, rect.position.y + rect.size.y - r), PI * 0.5],
		[Vector2(rect.position.x + r, rect.position.y + r), PI],
	]
	for c in corners:
		var centre: Vector2 = c[0]
		var start: float = c[1]
		for i in seg + 1:
			var a := start + (PI * 0.5) * float(i) / float(seg)
			pts.append(centre + Vector2(cos(a), sin(a)) * r)
	return pts


# ------------------------------------------------------------------ shapes --

## Fill plus ink outline. `ink` of width 0 skips the outline (for parts that sit
## inside another silhouette, like a face).
static func shape(ci: CanvasItem, pts: PackedVector2Array, fill: Color,
		ink: Color = INK, ink_width: float = 2.0) -> void:
	if pts.size() < 3:
		return
	ci.draw_colored_polygon(pts, fill)
	var closed := pts.duplicate()
	closed.append(pts[0])
	if sticker and ink_width < 0.0:
		pass
	if sticker and ink_width >= 0.0:
		ci.draw_polyline(closed, sticker_colour, ink_width + sticker_pad * 2.0, true)
	if ink_width > 0.0 and ink.a > 0.0:
		ci.draw_polyline(closed, ink, ink_width, true)


static func blob(ci: CanvasItem, centre: Vector2, r: float, fill: Color,
		ink_width: float = 2.0, seg: int = 20) -> void:
	shape(ci, circle(centre, r, seg), fill, INK, ink_width)


## A toy body: rounded rect with a lit top edge and a shaded underside.
## `bevel` is how far in the highlight sits; it is the cheapest way to make a
## flat shape read as a solid object.
static func body(ci: CanvasItem, rect: Rect2, radius: float, fill: Color,
		ink_width: float = 2.4) -> void:
	var pts := round_rect(rect, radius)
	shape(ci, pts, fill, INK, ink_width)
	# lit top: a thin band clipped to the shape by drawing an inset rounded rect
	var top := Rect2(rect.position + Vector2(radius * 0.25, radius * 0.35),
			Vector2(rect.size.x - radius * 0.5, max(2.0, rect.size.y * 0.22)))
	var lit := fill.lightened(0.28)
	ci.draw_colored_polygon(round_rect(top, radius * 0.7), lit)
	# underside
	var under := Rect2(rect.position + Vector2(radius * 0.3, rect.size.y * 0.74),
			Vector2(rect.size.x - radius * 0.6, max(2.0, rect.size.y * 0.2)))
	ci.draw_colored_polygon(round_rect(under, radius * 0.6), fill.darkened(0.22))


## Vertical two-stop gradient inside an arbitrary polygon. Used for hills and
## the ground, where a flat fill looks like paper.
static func grad_shape(ci: CanvasItem, pts: PackedVector2Array, top: Color, bottom: Color) -> void:
	var n := pts.size()
	if n < 3:
		return
	var colours := PackedColorArray()
	colours.resize(n)
	var lo := INF
	var hi := -INF
	for p in pts:
		lo = min(lo, p.y)
		hi = max(hi, p.y)
	var span: float = max(1.0, hi - lo)
	for i in n:
		colours[i] = top.lerp(bottom, clamp((pts[i].y - lo) / span, 0.0, 1.0))
	ci.draw_polygon(pts, colours)


# ------------------------------------------------------------------- face ---

## The cast's shared eye. Big white, dark pupil pushed toward `look`, one glint.
static func eye(ci: CanvasItem, centre: Vector2, r: float, look: Vector2 = Vector2(0.28, 0.0),
		pupil: Color = DARK) -> void:
	ci.draw_circle(centre, r, WHITE, true, -1.0, true)
	ci.draw_circle(centre + look * r, r * 0.56, pupil, true, -1.0, true)
	ci.draw_circle(centre + Vector2(-r * 0.3, -r * 0.34), r * 0.22, WHITE, true, -1.0, true)


static func eye_pair(ci: CanvasItem, centre: Vector2, r: float, dx: float,
		look: Vector2 = Vector2(0.28, 0.0)) -> void:
	eye(ci, centre + Vector2(-dx, 0), r, look)
	eye(ci, centre + Vector2(dx, 0), r, look)


## Blink: squash the eyes to a line. `open` 0..1.
static func blink_eyes(ci: CanvasItem, centre: Vector2, r: float, dx: float, open: float) -> void:
	for s in [-1.0, 1.0]:
		var c := centre + Vector2(s * dx, 0)
		if open < 0.18:
			ci.draw_line(c + Vector2(-r * 0.8, 0), c + Vector2(r * 0.8, 0), INK, max(1.5, r * 0.28), true)
		else:
			eye(ci, c, r, Vector2(0.28, 0.0))


## Mouth: a filled arc. `curve` in -1..1 bows it from frown to grin.
static func mouth(ci: CanvasItem, centre: Vector2, w: float, h: float, curve: float,
		fill: Color = Color("#8a3a4c")) -> void:
	var pts := PackedVector2Array()
	var seg := 10
	for i in seg + 1:
		var t := float(i) / float(seg)
		var x: float = lerpf(-w * 0.5, w * 0.5, t)
		var y := -sin(t * PI) * h * curve
		pts.append(centre + Vector2(x, y))
	# close it back along a shallower arc so it has thickness
	for i in seg + 1:
		var t := 1.0 - float(i) / float(seg)
		var x: float = lerpf(-w * 0.5, w * 0.5, t)
		var y := -sin(t * PI) * h * curve * 0.35 + h * 0.45
		pts.append(centre + Vector2(x, y))
	ci.draw_colored_polygon(pts, fill)


static func blush(ci: CanvasItem, centre: Vector2, s: float) -> void:
	for side in [-1.0, 1.0]:
		ci.draw_circle(centre + Vector2(side * s * 1.9, 0), s, Color("#ff9dbd", 0.55), true, -1.0, true)


# ------------------------------------------------------------------- misc ---

## Soft additive light. Cheap bloom substitute: draw a few concentric polygons
## additively instead of a screen-space blur pass, which the web renderer and
## a 2 MB download budget both appreciate.
static func glow(ci: CanvasItem, centre: Vector2, r: float, colour: Color,
		strength: float = 0.5, rings: int = 10) -> void:
	# radii shrink geometrically and alpha follows (1-t)^2, which reads as a
	# smooth falloff; a handful of equal-alpha discs bands badly at this size.
	for i in rings:
		var t := float(i) / float(rings)
		var rr := r * (1.0 - t * 0.86)
		var a := strength * 0.30 * pow(1.0 - t, 2.2)
		if a < 0.004:
			continue
		ci.draw_circle(centre, rr, Color(colour.r, colour.g, colour.b, a), true, -1.0, true)


static func sparkle(ci: CanvasItem, centre: Vector2, r: float, colour: Color) -> void:
	var pts := PackedVector2Array([
		centre + Vector2(0, -r), centre + Vector2(r * 0.28, -r * 0.28),
		centre + Vector2(r, 0), centre + Vector2(r * 0.28, r * 0.28),
		centre + Vector2(0, r), centre + Vector2(-r * 0.28, r * 0.28),
		centre + Vector2(-r, 0), centre + Vector2(-r * 0.28, -r * 0.28),
	])
	ci.draw_colored_polygon(pts, colour)


static func heart(ci: CanvasItem, centre: Vector2, s: float, fill: Color) -> void:
	var pts := PackedVector2Array()
	for i in 24:
		var a := TAU * float(i) / 24.0
		# cardioid is close enough at this size and has no seam
		var x := 16.0 * pow(sin(a), 3.0)
		var y := -(13.0 * cos(a) - 5.0 * cos(2.0 * a) - 2.0 * cos(3.0 * a) - cos(4.0 * a))
		pts.append(centre + Vector2(x, y) * (s / 18.0))
	shape(ci, pts, fill, INK, max(1.0, s * 0.12))


## Text without shipping a font file — Godot's built-in fallback is fine and
## keeps the download honest.
static func text(ci: CanvasItem, pos: Vector2, s: String, size: int, colour: Color,
		align: int = HORIZONTAL_ALIGNMENT_LEFT, outline: int = 0,
		outline_colour: Color = INK) -> void:
	# draw_string only honours alignment when it is given a width; with width -1
	# it always draws left-aligned from pos. Doing the offset here means every
	# centred and right-aligned string in the game is actually centred.
	var font: Font = ThemeDB.fallback_font
	var p := pos
	if align != HORIZONTAL_ALIGNMENT_LEFT:
		var w := font.get_string_size(s, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
		p.x -= w if align == HORIZONTAL_ALIGNMENT_RIGHT else w * 0.5
	if outline > 0:
		ci.draw_string_outline(font, p, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, outline, outline_colour)
	ci.draw_string(font, p, s, HORIZONTAL_ALIGNMENT_LEFT, -1, size, colour)
