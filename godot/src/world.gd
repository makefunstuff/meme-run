extends Node2D
## The world: you are inside the feed.
##
## The old backdrop was pastel hills over a grass-and-dirt strip, which is the
## default platformer look and says nothing about the game. This is the remake:
##
##   * the sky is a feed — a saturated gradient with halftone dots, scanlines,
##     a LIVE badge and rows of distant post cards receding into the dark
##   * the parallax layers are content, not scenery: huge floating posts behind,
##     drifting reaction stickers in front
##   * the floor is a TIMELINE — a scrubber track with tick marks and
##     candlesticks, sitting on top of the app panel you would see under it
##
## Everything is still drawn from primitives; no texture is ever loaded.

const Toy = preload("res://src/toy.gd")

var scroll := 0.0
var mode := "classic"
var t := 0.0
var ground_y := 590.0
var view := Vector2(1280, 720)

## Per-mode lighting. A mode is a different feed, not a colour filter.
const PALETTES := {
	"classic": {
		"sky": [Color("#0b0618"), Color("#2a0f3d"), Color("#6c1f57"), Color("#d13c63"), Color("#ff8a5c")],
		"card": Color("#160f24"), "card_edge": Color("#2d2142"), "card_bar": Color("#3b2a52"),
		"ink": Color("#1d1120"), "mint": Color("#7ff0a8"), "pink": Color("#ff3d7f"),
		"cyan": Color("#35d6ff"), "gold": Color("#ffd166"),
		"track": Color("#120b1e"), "track_hi": Color("#241736"), "panel": Color("#0a0712"),
		"glow": Color("#ff6a8a"),
	},
	"degen": {
		"sky": [Color("#02100a"), Color("#062a17"), Color("#0b4f28"), Color("#12884a"), Color("#4ff08a")],
		"card": Color("#04140c"), "card_edge": Color("#0e3320"), "card_bar": Color("#125231"),
		"ink": Color("#0a1f14"), "mint": Color("#8dffbc"), "pink": Color("#ff4d6d"),
		"cyan": Color("#7ff0d0"), "gold": Color("#ffe066"),
		"track": Color("#03120a"), "track_hi": Color("#0a2a17"), "panel": Color("#02100a"),
		"glow": Color("#4ff08a"),
	},
	"chaos": {
		"sky": [Color("#1a0410"), Color("#5c1030"), Color("#b31f45"), Color("#ff5a3c"), Color("#ffd166")],
		"card": Color("#1f0812"), "card_edge": Color("#45122a"), "card_bar": Color("#5e1738"),
		"ink": Color("#2a0712"), "mint": Color("#ffd166"), "pink": Color("#ff3d5a"),
		"cyan": Color("#8fe3ff"), "gold": Color("#ffe08a"),
		"track": Color("#1a0610"), "track_hi": Color("#3a0f22"), "panel": Color("#12040b"),
		"glow": Color("#ff7a3c"),
	},
	"ohio": {
		"sky": [Color("#06030f"), Color("#1b0733"), Color("#3d1166"), Color("#8a1f9e"), Color("#ff4fd8")],
		"card": Color("#0d0618"), "card_edge": Color("#241041"), "card_bar": Color("#33195c"),
		"ink": Color("#12051f"), "mint": Color("#b98bff"), "pink": Color("#ff4fd8"),
		"cyan": Color("#8fe3ff"), "gold": Color("#ffe08a"),
		"track": Color("#0a0413"), "track_hi": Color("#1d0c33"), "panel": Color("#070310"),
		"glow": Color("#c56bff"),
	},
}

var pal: Dictionary

func _ready() -> void:
	pal = PALETTES["classic"]

func set_mode(m: String) -> void:
	mode = m
	pal = PALETTES.get(m, PALETTES["classic"])
	queue_redraw()

func _process(delta: float) -> void:
	t += delta
	view = get_viewport().get_visible_rect().size
	ground_y = view.y * 0.8
	queue_redraw()

func _draw() -> void:
	Toy.sticker = false
	if pal.is_empty():
		return
	_draw_sky()
	_draw_posts()
	_draw_stickers()
	_draw_timeline()
	_draw_rail()

# -------------------------------------------------------------------- sky ---

func _draw_sky() -> void:
	var w := view.x
	var h := ground_y + 30.0
	var stops: Array = pal["sky"]
	var bands := 40
	for i in bands:
		var f0 := float(i) / float(bands)
		var f1 := float(i + 1) / float(bands)
		var quad := PackedVector2Array([Vector2(0, f0 * h), Vector2(w, f0 * h), Vector2(w, f1 * h), Vector2(0, f1 * h)])
		var c := _sky_at(f0)
		var c2 := _sky_at(f1)
		draw_polygon(quad, PackedColorArray([c, c, c2, c2]))

	# halftone: the texture of a printed poster, and it hides banding
	var dot_step := 14.0
	var dy := 0.0
	while dy < h:
		var dx := fposmod(dy * 1.7, dot_step)
		while dx < w:
			draw_circle(Vector2(dx, dy), 1.6, Color(1, 1, 1, 0.035), true, -1.0, true)
			dx += dot_step
		dy += dot_step

	# scanlines, drifting with the feed
	var sy := fposmod(t * 14.0, 6.0)
	while sy < h:
		draw_rect(Rect2(0, sy, w, 1.5), Color(0, 0, 0, 0.09))
		sy += 6.0

	# horizon glow where the timeline meets the dark
	var gl: Color = pal["glow"]
	for i in 8:
		var a := 0.07 * (1.0 - float(i) / 8.0)
		draw_rect(Rect2(0, ground_y - 8.0 - float(i) * 12.0, w, 20.0), Color(gl.r, gl.g, gl.b, a))

	_draw_live_badge()

func _sky_at(f: float) -> Color:
	var stops: Array = pal["sky"]
	var n := stops.size() - 1
	var x := clampf(f, 0.0, 1.0) * n
	var i := int(floor(x))
	if i >= n:
		return stops[n]
	return (stops[i] as Color).lerp(stops[i + 1], x - float(i))

## The app chrome, top right: a LIVE pill and a viewer count that ticks.
func _draw_live_badge() -> void:
	var x := view.x - 250.0
	var y := 96.0
	var pill := Rect2(x, y, 92.0, 30.0)
	Toy.shape(self, Toy.round_rect(pill, 15.0), Color(0.09, 0.05, 0.12, 0.72), Color(0, 0, 0, 0.3), 0.0)
	var pulse := 0.55 + 0.45 * sin(t * 4.0)
	draw_circle(Vector2(x + 17, y + 15), 5.0, Color(1, 0.25, 0.35, pulse), true, -1.0, true)
	Toy.text(self, Vector2(x + 30, y + 20), "LIVE", 12, Color(1, 0.93, 0.96), HORIZONTAL_ALIGNMENT_LEFT, 3, Color(0.25, 0.02, 0.08))
	var viewers := 12400 + int(sin(t * 0.7) * 380.0)
	Toy.text(self, Vector2(x + 100, y + 20), _compact(viewers), 12, Color(1, 1, 1, 0.75), HORIZONTAL_ALIGNMENT_LEFT, 3, Color(0, 0, 0, 0.4))

func _compact(v: int) -> String:
	if v >= 1000000:
		return "%.1fM" % (float(v) / 1000000.0)
	if v >= 1000:
		return "%.1fK" % (float(v) / 1000.0)
	return str(v)

# ------------------------------------------------------------- parallax -----

## Distant content: rows of post cards falling away into the dark. These replace
## the hills — the depth cue is content, not landscape.
func _draw_posts() -> void:
	var factor := 0.10
	var cols := 5
	var spacing := view.x * 0.42
	var period := spacing * float(cols)
	var off := fposmod(scroll * factor, period)
	var card_col: Color = pal["card"]
	var edge: Color = pal["card_edge"]
	var bar: Color = pal["card_bar"]
	for i in cols + 2:
		var x := float(i) * spacing - off - spacing * 0.5
		var seed := float(i) + floorf(scroll * factor / period)
		var h1 := fposmod(seed * 37.7, 1.0)
		var h2 := fposmod(seed * 71.3, 1.0)
		var cw := 150.0 + h1 * 90.0
		var ch := 190.0 + h2 * 130.0
		var cy := ground_y - 210.0 - h2 * 150.0 + sin(t * 0.25 + seed) * 8.0
		var alpha := 0.42 + h1 * 0.22
		var card := Rect2(x, cy - ch, cw, ch)
		Toy.shape(self, Toy.round_rect(card, 12.0), Color(card_col, alpha), Color(edge, alpha * 1.2), 2.0)
		# the "photo" inside the post
		var photo := Rect2(card.position.x + 10, card.position.y + 10, cw - 20, ch * 0.58)
		draw_colored_polygon(Toy.round_rect(photo, 8.0), Color(edge, alpha * 0.9))
		# caption bars
		for row in 2:
			var bw := (cw - 20) * (0.75 if row == 0 else 0.45)
			draw_colored_polygon(Toy.round_rect(Rect2(card.position.x + 10, photo.end.y + 10 + row * 12, bw, 6), 3.0),
				Color(bar, alpha))

## Drifting reaction stickers. Small, alive, and clearly not scenery.
func _draw_stickers() -> void:
	var factor := 0.34
	var spacing := 210.0
	var period := view.x + 260.0
	var off := fposmod(scroll * factor, spacing * 7.0)
	for i in 10:
		var x := fposmod(float(i) * spacing - off, period) - 130.0
		var seed := float(i) * 53.1
		var h := fposmod(seed * 0.13, 1.0)
		var y := ground_y - 150.0 - h * 260.0 + sin(t * 0.9 + seed) * 14.0
		var s := 0.75 + fposmod(seed * 0.7, 1.0) * 0.7
		var a := 0.35 + 0.3 * fposmod(seed * 0.31, 1.0)
		var spin := sin(t * 0.6 + seed) * 0.25
		draw_set_transform(Vector2(x, y), spin, Vector2(s, s))
		match i % 4:
			0:
				Toy.heart(self, Vector2.ZERO, 11.0, Color(pal["pink"], a))
			1:
				_draw_flame(Vector2.ZERO, 12.0, Color(pal["gold"], a))
			2:
				draw_circle(Vector2.ZERO, 12.0, Color(pal["mint"], a), true, -1.0, true)
				Toy.text(self, Vector2(0, 5), "$", 16, Color(0.05, 0.2, 0.1, a), HORIZONTAL_ALIGNMENT_CENTER)
			_:
				draw_circle(Vector2.ZERO, 12.0, Color(pal["cyan"], a), true, -1.0, true)
				draw_arc(Vector2.ZERO, 12.0, -0.6, 1.2, 12, Color(0.02, 0.1, 0.16, a), 3.0, true)
		draw_set_transform(Vector2.ZERO, 0.0, Vector2(1, 1))

func _draw_flame(c: Vector2, r: float, col: Color) -> void:
	var pts := PackedVector2Array([
		c + Vector2(0, -r * 1.4), c + Vector2(r * 0.55, -r * 0.25),
		c + Vector2(r * 0.42, r * 0.75), c + Vector2(0, r * 1.05),
		c + Vector2(-r * 0.42, r * 0.75), c + Vector2(-r * 0.55, -r * 0.25)])
	draw_colored_polygon(pts, col)
	draw_colored_polygon(PackedVector2Array([
		c + Vector2(0, -r * 0.5), c + Vector2(r * 0.22, r * 0.3),
		c + Vector2(-r * 0.22, r * 0.3)]), Color(1, 1, 0.85, col.a * 0.8))

# --------------------------------------------------------------- timeline ---

## The floor is a scrubber: a track with ticks and candles, the playhead, and the
## app panel underneath. This is the whole point — the character is running along
## the timeline of the feed.
func _draw_timeline() -> void:
	var w := view.x
	var h := view.y
	var track_h := 46.0
	var track_top := ground_y - 6.0
	var track_col: Color = pal["track"]
	var hi: Color = pal["track_hi"]
	var mint: Color = pal["mint"]

	# the "now" line the player runs on
	draw_rect(Rect2(0, track_top, w, 3.0), mint)
	draw_rect(Rect2(0, track_top - 3.0, w, 3.0), Color(mint.r, mint.g, mint.b, 0.25))

	# track body
	draw_rect(Rect2(0, track_top + 3.0, w, track_h), track_col)
	draw_rect(Rect2(0, track_top + track_h + 3.0, w, 2.0), Color(0, 0, 0, 0.5))

	# tick marks, scrolling with the world
	var step := 26.0
	var x0 := -fposmod(scroll * 1.0, step)
	var x := x0
	while x < w + step:
		var major := fposmod(x - x0, step * 5.0) < 1.0
		var th := 10.0 if major else 5.0
		draw_rect(Rect2(x, track_top + track_h + 3.0 - th, 1.5, th), Color(1, 1, 1, 0.16 if major else 0.09))
		x += step

	# candlesticks riding the track
	var cstep := 34.0
	var cx := -fposmod(scroll * 1.0, cstep)
	while cx < w + cstep:
		var seed := floorf((cx + scroll) / cstep)
		var hh := fposmod(seed * 17.3, 1.0)
		var body_h := 6.0 + hh * 18.0
		var up := fposmod(seed * 5.7, 1.0) > 0.45
		var col: Color = mint if up else Color(pal["pink"])
		var cw := 5.0
		var cy := track_top + 8.0 + (track_h - 16.0) * 0.5
		draw_rect(Rect2(cx + cw * 0.5, cy - body_h * 0.5 - 4.0, 1.5, 4.0), Color(col, 0.55))
		draw_rect(Rect2(cx, cy - body_h * 0.5, cw, body_h), Color(col, 0.85))
		draw_rect(Rect2(cx + cw * 0.5, cy + body_h * 0.5, 1.5, 4.0), Color(col, 0.55))
		cx += cstep

	# playhead: marks where you are on the timeline
	var px := view.x * 0.38
	draw_rect(Rect2(px - 1.5, track_top - 12.0, 3.0, track_h + 24.0), Color(1, 1, 1, 0.10))
	var head := PackedVector2Array([
		Vector2(px - 8.0, track_top - 12.0), Vector2(px + 8.0, track_top - 12.0),
		Vector2(px, track_top - 3.0)])
	draw_colored_polygon(head, mint)

	# ---- price ticker, the noise the feed is made of
	var tick_top := track_top + track_h + 5.0
	var tick_h := 20.0
	draw_rect(Rect2(0, tick_top, w, tick_h), Color(0, 0, 0, 0.5))
	_draw_ticker(tick_top + tick_h * 0.72)

	# ---- app panel below
	var panel_top := tick_top + tick_h
	var panel: Color = pal["panel"]
	draw_rect(Rect2(0, panel_top, w, h - panel_top), panel)
	# faint grid, like an empty feed
	for i in 8:
		var yy := panel_top + float(i) * 22.0
		draw_rect(Rect2(0, yy, w, 1.0), Color(1, 1, 1, 0.025))
	var gx := -fposmod(scroll * 1.0, 44.0)
	while gx < w:
		draw_rect(Rect2(gx, panel_top, 1.0, h - panel_top), Color(1, 1, 1, 0.022))
		gx += 44.0

	# tab bar
	var tab_h := 34.0
	var tab_y := h - tab_h
	draw_rect(Rect2(0, tab_y, w, tab_h), Color(0, 0, 0, 0.45))
	draw_rect(Rect2(0, tab_y, w, 1.5), Color(1, 1, 1, 0.07))
	var tabs := 5
	for i in tabs:
		var tx := w * (float(i) + 0.5) / float(tabs)
		var active: bool = i == 2
		var c: Color = mint if active else Color(1, 1, 1, 0.28)
		_draw_tab_icon(Vector2(tx, tab_y + tab_h * 0.5), i, c, active)
	# scrub handle
	var handle := Rect2(px - 26.0, tab_y - 26.0, 52.0, 18.0)
	Toy.shape(self, Toy.round_rect(handle, 9.0), Color(mint, 0.9), Color(0, 0, 0, 0.35), 1.2)
	Toy.text(self, Vector2(px, tab_y - 12.0), _pct(), 11, Color(0.04, 0.16, 0.09), HORIZONTAL_ALIGNMENT_CENTER)

const TICKER := [["PEPE", 12.4], ["MOON", 411.0], ["RUG", -99.9], ["SHIB", 6.9], ["NPC", -0.4],
	["WAGMI", 88.0], ["CHAD", 100.0], ["BONK", 250.3], ["REKT", -96.3], ["BAG", 4.2],
	["SUS", -69.0], ["OHIO", -99.9]]

func _draw_ticker(baseline: float) -> void:
	var font: Font = ThemeDB.fallback_font
	var mint: Color = pal["mint"]
	var pink: Color = pal["pink"]
	var gold: Color = pal["gold"]
	var x := -fposmod(scroll * 0.55, 1900.0)
	var i := 0
	while x < view.x + 240.0:
		var item: Array = TICKER[i % TICKER.size()]
		var up: bool = float(item[1]) > 0.0
		var col: Color = mint if up else pink
		var label := "$" + String(item[0])
		var pct := ("%+.1f%%" % float(item[1]))
		Toy.text(self, Vector2(x, baseline), label, 10, Color(1, 1, 1, 0.55))
		var lw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x
		Toy.text(self, Vector2(x + lw + 5, baseline), pct, 10, col)
		var pw := font.get_string_size(pct, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x
		draw_circle(Vector2(x + lw + pw + 16, baseline - 3.5), 1.6, Color(gold, 0.6), true, -1.0, true)
		x += lw + pw + 44.0
		i += 1

## The engagement rail down the right edge: likes, comments, shares, coin.
func _draw_rail() -> void:
	var x := view.x - 44.0
	var y0 := ground_y - 250.0
	var mint: Color = pal["mint"]
	var pink: Color = pal["pink"]
	var gold: Color = pal["gold"]
	var cyan: Color = pal["cyan"]
	for i in 4:
		var y := y0 + float(i) * 52.0
		var bob := sin(t * 1.4 + float(i)) * 2.0
		var c := Vector2(x, y + bob)
		draw_circle(c, 16.0, Color(0.05, 0.03, 0.08, 0.55), true, -1.0, true)
		match i:
			0:
				Toy.heart(self, c, 10.0, Color(pink, 0.9))
			1:
				var b := PackedVector2Array([
					c + Vector2(-11, -7), c + Vector2(11, -7), c + Vector2(11, 4),
					c + Vector2(2, 4), c + Vector2(-3, 11), c + Vector2(-3, 4), c + Vector2(-11, 4)])
				draw_colored_polygon(b, Color(1, 1, 1, 0.85))
			2:
				draw_line(c + Vector2(-9, 2), c + Vector2(9, -4), Color(1, 1, 1, 0.85), 2.6, true)
				draw_line(c + Vector2(9, -4), c + Vector2(2, -7), Color(1, 1, 1, 0.85), 2.6, true)
				draw_line(c + Vector2(9, -4), c + Vector2(6, 3), Color(1, 1, 1, 0.85), 2.6, true)
			_:
				draw_circle(c, 10.0, Color(gold, 0.9), true, -1.0, true)
				Toy.text(self, c + Vector2(0, 4), "$", 13, Color(0.2, 0.12, 0.02), HORIZONTAL_ALIGNMENT_CENTER)
		var count: String = ["12.4K", "3.1K", "891", "42"][i]
		Toy.text(self, Vector2(x, y + 30), count, 9, Color(1, 1, 1, 0.6), HORIZONTAL_ALIGNMENT_CENTER)

func _pct() -> String:
	var v := fposmod(scroll / 240.0, 100.0)
	return "%d%%" % int(v)

func _draw_tab_icon(c: Vector2, i: int, col: Color, active: bool) -> void:
	var r := 8.0 if active else 6.5
	match i:
		0:  # home
			draw_colored_polygon(PackedVector2Array([
				c + Vector2(0, -r), c + Vector2(r, 0), c + Vector2(r * 0.55, 0),
				c + Vector2(r * 0.55, r), c + Vector2(-r * 0.55, r), c + Vector2(-r * 0.55, 0),
				c + Vector2(-r, 0)]), col)
		1:  # search
			draw_arc(c + Vector2(-1, -1), r * 0.7, 0, TAU, 14, col, 2.2, true)
			draw_line(c + Vector2(r * 0.35, r * 0.35), c + Vector2(r, r), col, 2.4, true)
		2:  # post
			draw_rect(Rect2(c - Vector2(r, r), Vector2(r * 2, r * 2)), col)
			draw_rect(Rect2(c - Vector2(r * 0.45, 1.0), Vector2(r * 0.9, 2.0)), Color(0.04, 0.16, 0.09))
		3:  # alerts
			draw_colored_polygon(PackedVector2Array([
				c + Vector2(0, -r), c + Vector2(r * 0.8, r * 0.35),
				c + Vector2(-r * 0.8, r * 0.35)]), col)
			draw_circle(c + Vector2(0, r * 0.62), r * 0.24, col, true, -1.0, true)
		_:  # profile
			draw_circle(c + Vector2(0, -r * 0.35), r * 0.45, col, true, -1.0, true)
			draw_arc(c + Vector2(0, r * 0.95), r * 0.8, PI, TAU, 12, col, 2.6, true)
