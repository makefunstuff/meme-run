extends Control
## The interface.
##
## Drawn entirely in code, in the same visual language as the game: ink outlines,
## cream fills, a lit edge, and a shadow — so the UI reads as part of the toy
## rather than as grey widgets floating over it. Everything is built from a few
## primitives so the whole thing can be re-skinned from the palette table.

const Toy = preload("res://src/toy.gd")

const INK := Color("#1d1120")
const CARD := Color("#191227")
const CARD_HI := Color("#1d1730")
const CREAM := Color("#fff3e2")
const MINT := Color("#7ff0a8")
const PINK := Color("#ff5d73")
const GOLD := Color("#ffd166")
const BLUE := Color("#8fd6ff")

var game: Node = null
var state := "menu"
var t := 0.0
var click_rects: Array = []
var hover := Vector2(-500, -500)
var menu_mode := "classic"
var banner_text := ""
var banner_sub := ""
var banner_t := 0.0
var banner_max := 2.6
var toast_text := ""
var toast_t := 0.0

const MODES := [
	["classic", "CLASSIC", "the standard doomscroll"],
	["degen", "DEGEN", "market open, x2 p&l"],
	["chaos", "CHAOS", "everything is too much"],
	["ohio", "OHIO", "physics is a lie"],
]

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP

func show_banner(main: String, sub: String) -> void:
	banner_text = main
	banner_sub = sub
	banner_t = 2.8
	banner_max = 2.8

func show_toast(s: String) -> void:
	toast_text = s
	toast_t = 2.2

func _process(delta: float) -> void:
	t += delta
	banner_t = maxf(0.0, banner_t - delta)
	toast_t = maxf(0.0, toast_t - delta)
	hover = get_local_mouse_position()
	queue_redraw()

# ----------------------------------------------------------------- input ----

func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		return
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		for c in click_rects:
			if c["rect"].has_point(event.position):
				_do(c["action"], c["arg"])
				get_viewport().set_input_as_handled()
				return
	if event is InputEventKey and event.pressed and not event.echo:
		if state == "menu":
			if event.keycode == KEY_ENTER or event.keycode == KEY_SPACE:
				_do("start", menu_mode)
			for i in MODES.size():
				if event.keycode == KEY_1 + i:
					_do("mode", MODES[i][0])
		elif state == "over":
			if event.keycode in [KEY_ENTER, KEY_SPACE, KEY_R]:
				_do("restart", null)
		else:
			if event.keycode == KEY_ESCAPE or event.keycode == KEY_P:
				_do("pause", null)

func _do(action: String, arg) -> void:
	match action:
		"start": game.start_run(String(arg))
		"mode":
			menu_mode = String(arg)
			if game != null:
				game.world.set_mode(menu_mode)
				game.set_mode(menu_mode)
		"restart": game.restart()
		"pause": game.toggle_pause()

# --------------------------------------------------------------- primitives --

## A panel with an ink edge, a lit top edge and a soft drop shadow.
func _panel(rect: Rect2, radius: float = 14.0, fill: Color = CARD, alpha: float = 1.0) -> void:
	draw_colored_polygon(Toy.round_rect(Rect2(rect.position + Vector2(0, 4), rect.size), radius),
		Color(0.02, 0.01, 0.05, 0.45 * alpha))
	Toy.shape(self, Toy.round_rect(rect, radius), Color(fill, alpha), Color(INK, alpha), 2.0)
	# lit top edge, same trick the characters use
	var hi := Rect2(rect.position + Vector2(radius * 0.55, 2.0),
		Vector2(rect.size.x - radius * 1.1, 1.6))
	draw_colored_polygon(Toy.round_rect(hi, 1.0), Color(1, 1, 1, 0.10 * alpha))

func _keycap(pos: Vector2, label: String, w: float = 22.0) -> float:
	var font: Font = ThemeDB.fallback_font
	var tw := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x
	var kw := maxf(w, tw + 12.0)
	var r := Rect2(pos, Vector2(kw, 20))
	Toy.shape(self, Toy.round_rect(r, 5.0), Color(0.11, 0.09, 0.16), Color(0.45, 0.4, 0.55), 1.4)
	Toy.text(self, Vector2(r.position.x + (kw - tw) * 0.5, r.position.y + 14), label, 10,
		Color(0.86, 0.9, 0.98))
	return kw

func _heading(pos: Vector2, s: String, size: int, colour: Color) -> void:
	Toy.text(self, pos, s, size, colour, HORIZONTAL_ALIGNMENT_CENTER, maxi(3, int(size * 0.18)), INK)

# -------------------------------------------------------------------- menu --

func _draw() -> void:
	click_rects.clear()
	var vp := get_viewport_rect().size
	match state:
		"menu": _draw_menu(vp)
		_: _draw_hud(vp)
	if state == "over":
		_draw_over(vp)
	elif state != "menu" and game != null and game.paused:
		_draw_pause(vp)

func _draw_menu(vp: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, vp), Color(0.03, 0.02, 0.07, 0.62))
	var w := minf(720.0, vp.x - 60.0)
	var h := minf(540.0, vp.y - 60.0)
	var card := Rect2((vp.x - w) * 0.5, (vp.y - h) * 0.5, w, h)
	_panel(card, 18.0)

	# accent bar: two colours, the same pairing as the logo
	var top := Rect2(card.position.x + 18, card.position.y + 16, (w - 36) * 0.62, 4)
	draw_colored_polygon(Toy.round_rect(top, 2.0), MINT)
	var top2 := Rect2(card.position.x + 18 + (w - 36) * 0.62, card.position.y + 16, (w - 36) * 0.38, 4)
	draw_colored_polygon(Toy.round_rect(top2, 2.0), PINK)

	var cx := vp.x * 0.5
	var font: Font = ThemeDB.fallback_font

	# logo: two-tone, inked, with a highlight band
	var lsize := 58
	var meme_w := font.get_string_size("MEME", HORIZONTAL_ALIGNMENT_LEFT, -1, lsize).x
	var run_w := font.get_string_size("RUN", HORIZONTAL_ALIGNMENT_LEFT, -1, lsize).x
	var total := meme_w + run_w + 10.0
	var lx := cx - total * 0.5
	var ly := card.position.y + 96
	Toy.text(self, Vector2(lx, ly), "MEME", lsize, MINT, HORIZONTAL_ALIGNMENT_LEFT, 10, Color(0.05, 0.22, 0.11))
	Toy.text(self, Vector2(lx + meme_w + 10.0, ly), "RUN", lsize, Color(1.0, 0.97, 0.99), HORIZONTAL_ALIGNMENT_LEFT, 10, Color(0.22, 0.05, 0.14))
	Toy.text(self, Vector2(cx, ly + 24), "G O D O T   E D I T I O N     ·     N O T   F I N A N C I A L   A D V I C E",
		9, Color(0.55, 0.66, 0.62), HORIZONTAL_ALIGNMENT_CENTER)

	# blurb
	var lines := [
		"The Algorithm is chasing you and the market is open.",
		"Outrun the feed, shoot the memes, leave with the bag.",
	]
	for i in lines.size():
		Toy.text(self, Vector2(cx, ly + 54 + i * 19), lines[i], 13, Color(0.78, 0.83, 0.92),
			HORIZONTAL_ALIGNMENT_CENTER)

	# mode cards
	var gy := card.position.y + 216
	var gap := 14.0
	var cw := (w - 60.0 - gap) * 0.5
	var ch := 62.0
	for i in MODES.size():
		var m: Array = MODES[i]
		var r := Rect2(card.position.x + 30 + (cw + gap) * float(i % 2),
			gy + (ch + gap) * float(i / 2), cw, ch)
		_mode_card(r, m, menu_mode == String(m[0]))

	# start button
	var bw := minf(340.0, w - 120.0)
	var br := Rect2(cx - bw * 0.5, gy + (ch + gap) * 2.0 + 14.0, bw, 54)
	var hot := br.has_point(hover)
	var pulse := 0.5 + 0.5 * sin(t * 2.6)
	var fill := Color(0.13, 0.55, 0.30).lerp(Color(0.18, 0.68, 0.36), pulse * 0.5)
	if hot:
		fill = fill.lightened(0.12)
	draw_colored_polygon(Toy.round_rect(Rect2(br.position + Vector2(0, 4), br.size), 12.0), Color(0.02, 0.1, 0.05, 0.5))
	Toy.shape(self, Toy.round_rect(br, 12.0), fill, Color(0.62, 1.0, 0.76), 2.2)
	Toy.text(self, Vector2(cx, br.position.y + 34), "OPEN THE POSITION", 19,
		Color(1, 1, 1), HORIZONTAL_ALIGNMENT_CENTER, 5, Color(0.03, 0.22, 0.1))
	click_rects.append({"rect": br, "action": "start", "arg": menu_mode})

	# controls as key caps
	var keys := [["A / D", "move"], ["SPACE", "jump"], ["SHIFT", "dash"], ["J", "shoot"]]
	var kw := [["A / D"], ["SPACE"], ["SHIFT"], ["J"]]
	var widths := [0.0, 0.0, 0.0, 0.0]
	for i in keys.size():
		widths[i] = maxf(26.0, font.get_string_size(String(keys[i][0]), HORIZONTAL_ALIGNMENT_LEFT, -1, 10).x + 12.0)
	var sep := 26.0
	var total_w := 0.0
	for i in keys.size():
		total_w += widths[i] + sep + font.get_string_size(String(keys[i][1]), HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x
	total_w -= sep
	var kx := cx - total_w * 0.5
	var ky := card.end.y - 40.0
	for i in keys.size():
		var w2 := _keycap(Vector2(kx, ky - 15), String(keys[i][0]), widths[i])
		kx += w2 + 6.0
		Toy.text(self, Vector2(kx, ky + 1), String(keys[i][1]), 11, Color(0.6, 0.67, 0.78))
		kx += font.get_string_size(String(keys[i][1]), HORIZONTAL_ALIGNMENT_LEFT, -1, 11).x + sep

func _mode_card(r: Rect2, m: Array, selected: bool) -> void:
	var hot := r.has_point(hover)
	var fill := CARD_HI
	var edge := Color(0.36, 0.31, 0.46)
	if selected:
		fill = Color(0.10, 0.28, 0.18)
		edge = Color(0.45, 0.95, 0.62)
	elif hot:
		fill = CARD_HI.lightened(0.12)
	Toy.shape(self, Toy.round_rect(r, 11.0), fill, edge, 2.0)
	_icon(Vector2(r.position.x + 26, r.position.y + 26), String(m[0]), selected)
	Toy.text(self, Vector2(r.position.x + 48, r.position.y + 27), String(m[1]), 16,
		Color(0.72, 1.0, 0.82) if selected else Color(0.94, 0.96, 1.0))
	Toy.text(self, Vector2(r.position.x + 48, r.position.y + 45), String(m[2]), 10,
		Color(0.58, 0.66, 0.78))
	if selected:
		Toy.sparkle(self, Vector2(r.end.x - 18, r.position.y + 18), 6.0, MINT)
	click_rects.append({"rect": r, "action": "mode", "arg": m[0]})

## A one-glyph icon per mode, drawn rather than imported.
func _icon(c: Vector2, mode: String, selected: bool) -> void:
	var ink := INK
	match mode:
		"classic":
			draw_circle(c, 11.0, GOLD, true, -1.0, true)
			draw_circle(c, 11.0, ink, false, 1.6, true)
			draw_circle(c, 6.5, GOLD.darkened(0.25), false, 1.4, true)
		"degen":
			var pts := PackedVector2Array([
				c + Vector2(-10, 6), c + Vector2(-4, -2), c + Vector2(2, 3),
				c + Vector2(6, -9), c + Vector2(10, -1), c + Vector2(10, 8), c + Vector2(-10, 8)])
			Toy.shape(self, pts, MINT.darkened(0.1), ink, 1.6)
		"chaos":
			Toy.sparkle(self, c, 12.0, Color("#ffb066"))
			draw_circle(c, 3.0, ink, true, -1.0, true)
		"ohio":
			draw_arc(c, 10.0, 0.4, TAU + 0.4, 20, PINK, 3.0, true)
			draw_arc(c, 5.0, 1.4, TAU + 1.4, 16, PINK, 2.6, true)

# --------------------------------------------------------------------- hud --

func _draw_hud(vp: Vector2) -> void:
	if game == null:
		return
	var font: Font = ThemeDB.fallback_font

	# ---- wordmark, top left
	Toy.text(self, Vector2(28, 36), "MEME", 20, MINT, HORIZONTAL_ALIGNMENT_LEFT, 5, Color(0.05, 0.22, 0.11))
	var mw := font.get_string_size("MEME", HORIZONTAL_ALIGNMENT_LEFT, -1, 20).x
	Toy.text(self, Vector2(28 + mw, 36), "RUN", 20, Color(1.0, 0.97, 0.99), HORIZONTAL_ALIGNMENT_LEFT, 5, Color(0.22, 0.05, 0.14))
	Toy.text(self, Vector2(29, 51), "%s RUN" % game.mode.to_upper(), 9, Color(0.62, 0.7, 0.8))

	# ---- combo chip with a draining timer bar
	if game.combo >= 2:
		var frac: float = clampf(game.combo_t / 2.6, 0.0, 1.0)
		var cr := Rect2(26, 62, 104, 26)
		Toy.shape(self, Toy.round_rect(cr, 13.0), Color(0.08, 0.26, 0.16), Color(0.42, 0.95, 0.6), 1.6)
		draw_rect(Rect2(cr.position.x + 3, cr.position.y + cr.size.y - 4, (cr.size.x - 6) * frac, 2), MINT)
		Toy.text(self, Vector2(cr.position.x + 12, cr.position.y + 18), "x%d" % game.combo, 15, Color(0.75, 1.0, 0.8))
		Toy.text(self, Vector2(cr.position.x + 42, cr.position.y + 18), "COMBO", 9, Color(0.55, 0.85, 0.64))

	# ---- instrument strip
	var y := 18.0
	var ph := 54.0
	var pw := 128.0                     # P&L hero
	var widths := [76.0, 62.0, 108.0]   # metres, bag, weapon
	var hearts_w := 74.0
	var strip_w: float = pw + widths[0] + widths[1] + widths[2] + hearts_w
	var sx: float = vp.x - strip_w - 24.0
	_panel(Rect2(sx, y, strip_w, ph), 13.0, CARD, 0.94)

	# hero cell
	var hero := Rect2(sx + 8, y + 7, pw - 12, ph - 14)
	Toy.shape(self, Toy.round_rect(hero, 9.0), Color(0.10, 0.20, 0.15), Color(0.3, 0.6, 0.42), 1.4)
	Toy.text(self, Vector2(hero.position.x + 10, hero.position.y + 14), "P&L", 9, Color(0.55, 0.78, 0.62))
	Toy.text(self, Vector2(hero.position.x + 12, hero.position.y + 38), "$" + _fmt(game.pnl), 24,
		Color(0.6, 1.0, 0.72), HORIZONTAL_ALIGNMENT_LEFT, 4, Color(0.04, 0.2, 0.1))

	var x: float = sx + pw
	x = _cell(x, y, widths[0], ph, "METRES", str(int(game.dist)))
	x = _cell(x, y, widths[1], ph, "BAG", str(game.bag), GOLD)
	x = _cell(x, y, widths[2], ph, "WEAPON", _weapon_name(), BLUE)

	# hearts, right of the strip
	var hx: float = x + 10
	for i in game.player.max_health:
		var filled: bool = i < game.player.health
		Toy.heart(self, Vector2(hx + i * 22, y + ph * 0.5), 10.0,
			PINK if filled else Color(0.22, 0.18, 0.26))

	# dash readiness: a hairline under the strip, not a second widget
	var p = game.player
	if p != null:
		var frac2: float = 1.0 - clampf(p.dash_cd / p.DASH_CD, 0.0, 1.0)
		var dr := Rect2(sx + strip_w * 0.45, y + ph + 7, strip_w * 0.55, 3)
		draw_rect(dr, Color(0.09, 0.07, 0.14, 0.7))
		draw_rect(Rect2(dr.position, Vector2(dr.size.x * frac2, dr.size.y)),
			Color(0.45, 0.85, 0.6, 0.85) if frac2 >= 1.0 else Color(0.4, 0.45, 0.62, 0.8))
		if frac2 >= 1.0:
			Toy.text(self, Vector2(sx + strip_w - 40, y + ph + 18), "DASH", 9, Color(0.45, 0.72, 0.56))

	# ---- boss bar, bottom centre
	if game.boss != null and is_instance_valid(game.boss) and not game.boss.dead:
		var bw := minf(520.0, vp.x - 260.0)
		var br := Rect2((vp.x - bw) * 0.5, vp.y - 46, bw, 14)
		_panel(Rect2(br.position - Vector2(6, 6), br.size + Vector2(12, 12)), 8.0, CARD, 0.9)
		var frac3: float = clampf(float(game.boss.hp) / float(game.boss.max_hp), 0.0, 1.0)
		draw_rect(Rect2(br.position, Vector2(bw * frac3, br.size.y)), PINK)
		draw_rect(Rect2(br.position, Vector2(bw * frac3, br.size.y * 0.4)), Color(1, 1, 1, 0.18))
		draw_rect(br, INK, false, 1.6)
		_heading(Vector2(vp.x * 0.5, br.position.y - 10), "THE ALGORITHM", 11, Color(0.95, 0.9, 1.0))

	# ---- banner
	if banner_t > 0.0:
		var a: float = clampf(banner_t / 0.35, 0.0, 1.0) * clampf((banner_max - banner_t) / 0.15, 0.0, 1.0)
		var bw2 := 400.0
		var r2 := Rect2((vp.x - bw2) * 0.5, 104, bw2, 64)
		_panel(r2, 10.0, Color(0.09, 0.06, 0.15), a)
		draw_rect(Rect2(r2.position.x + 12, r2.position.y + 2, bw2 * 0.4, 3), Color(MINT, a))
		draw_rect(Rect2(r2.position.x + 12 + bw2 * 0.4, r2.position.y + 2, bw2 * 0.24, 3), Color(PINK, a))
		Toy.text(self, Vector2(vp.x * 0.5, r2.position.y + 36), banner_text, 22,
			Color(1, 1, 1, a), HORIZONTAL_ALIGNMENT_CENTER, 5, Color(0.05, 0.02, 0.08, a))
		Toy.text(self, Vector2(vp.x * 0.5, r2.position.y + 53), banner_sub, 11,
			Color(0.8, 0.86, 0.95, a), HORIZONTAL_ALIGNMENT_CENTER)

	# ---- toast
	if toast_t > 0.0:
		var a2: float = clampf(toast_t / 0.3, 0.0, 1.0)
		var tw := font.get_string_size(toast_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 13).x
		var tr := Rect2((vp.x - tw) * 0.5 - 16, 176, tw + 32, 28)
		_panel(tr, 8.0, Color(0.10, 0.24, 0.16), a2)
		Toy.text(self, Vector2(vp.x * 0.5, tr.position.y + 19), toast_text, 13,
			Color(0.85, 1.0, 0.9, a2), HORIZONTAL_ALIGNMENT_CENTER)

func _cell(x: float, y: float, w: float, h: float, label: String, value: String,
		colour: Color = Color(0.95, 0.97, 1.0)) -> float:
	draw_line(Vector2(x, y + 10), Vector2(x, y + h - 10), Color(0.3, 0.26, 0.4, 0.7), 1.0)
	Toy.text(self, Vector2(x + 12, y + 18), label, 8, Color(0.55, 0.62, 0.75))
	Toy.text(self, Vector2(x + 12, y + 39), value, 17, colour, HORIZONTAL_ALIGNMENT_LEFT, 3, Color(0.04, 0.03, 0.06))
	return x + w

func _weapon_name() -> String:
	var s: String = game.weapon_label()
	return s

func _weapon_icon(c: Vector2) -> void:
	var w: String = game.player.weapon if game.player != null else "blaster"
	var col := BLUE
	match w:
		"bread": col = Color("#e8b072")
		"prism": col = BLUE
		"void": col = Toy.LILAC
		"sus": col = PINK
		"moon": col = Color("#ffb3c8")
		"pump": col = MINT
		"lever": col = BLUE
		"drop": col = GOLD
	draw_rect(Rect2(c.x - 9, c.y - 3, 14, 6), col)
	draw_rect(Rect2(c.x - 9, c.y - 3, 14, 6), INK, false, 1.2)
	draw_rect(Rect2(c.x - 6, c.y + 2, 5, 5), Color("#2f2a3a"))
	draw_circle(Vector2(c.x + 7, c.y), 3.2, Color(1, 1, 1, 0.85), true, -1.0, true)

# --------------------------------------------------------------- game over --

func _draw_over(vp: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, vp), Color(0.03, 0.02, 0.07, 0.66))
	var w := minf(520.0, vp.x - 60.0)
	var h: float = 372.0
	var card := Rect2((vp.x - w) * 0.5, (vp.y - h) * 0.5, w, h)
	_panel(card, 16.0)
	draw_rect(Rect2(card.position.x + 16, card.position.y + 14, (w - 32) * 0.55, 4), PINK)
	draw_rect(Rect2(card.position.x + 16 + (w - 32) * 0.55, card.position.y + 14, (w - 32) * 0.2, 4), GOLD)

	var cx := vp.x * 0.5
	_heading(Vector2(cx, card.position.y + 62), "LIQUIDATED", 38, PINK)
	Toy.text(self, Vector2(cx, card.position.y + 84), game.death_line, 12,
		Color(0.74, 0.79, 0.88), HORIZONTAL_ALIGNMENT_CENTER)

	# the numbers, as a two-column table with rules
	var rows := [
		["P&L", "$" + _fmt(game.pnl), Color(0.6, 1.0, 0.72)],
		["METRES", str(int(game.dist)), Color(0.95, 0.97, 1.0)],
		["KILLS", str(game.kills), Color(0.95, 0.97, 1.0)],
		["BAG", str(game.bag), GOLD],
		["BEST COMBO", "x" + str(game.best_combo), MINT],
	]
	var ty := card.position.y + 108
	for i in rows.size():
		var yy := ty + i * 27
		if i % 2 == 0:
			draw_rect(Rect2(card.position.x + 24, yy - 12, w - 48, 24), Color(1, 1, 1, 0.03))
		Toy.text(self, Vector2(card.position.x + 36, yy + 4), rows[i][0], 12, Color(0.58, 0.65, 0.78))
		Toy.text(self, Vector2(card.end.x - 36, yy + 4), rows[i][1], 15, rows[i][2], HORIZONTAL_ALIGNMENT_RIGHT)

	# best badge
	var badge := Rect2(cx - 108, ty + rows.size() * 27 + 4, 216, 24)
	Toy.shape(self, Toy.round_rect(badge, 12.0), Color(0.10, 0.16, 0.12), Color(0.4, 0.8, 0.5), 1.4)
	Toy.text(self, Vector2(cx, badge.position.y + 16), "ALL-TIME HIGH  $%s" % _fmt(game.best), 11,
		Color(0.78, 0.95, 0.8), HORIZONTAL_ALIGNMENT_CENTER)

	var br := Rect2(cx - 140, card.end.y - 68, 280, 46)
	var hot := br.has_point(hover)
	var fill := Color(0.13, 0.55, 0.30)
	if hot:
		fill = fill.lightened(0.14)
	Toy.shape(self, Toy.round_rect(br, 11.0), fill, Color(0.62, 1.0, 0.76), 2.0)
	Toy.text(self, Vector2(cx, br.position.y + 30), "RUN IT BACK", 18, Color(1, 1, 1),
		HORIZONTAL_ALIGNMENT_CENTER, 4, Color(0.03, 0.2, 0.1))
	click_rects.append({"rect": br, "action": "restart", "arg": null})

func _draw_pause(vp: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, vp), Color(0.03, 0.02, 0.07, 0.62))
	var card := Rect2(vp.x * 0.5 - 150, vp.y * 0.5 - 60, 300, 120)
	_panel(card, 14.0)
	_heading(Vector2(vp.x * 0.5, card.position.y + 52), "PAUSED", 32, CREAM)
	Toy.text(self, Vector2(vp.x * 0.5, card.position.y + 84), "ESC to resume", 12,
		Color(0.7, 0.76, 0.88), HORIZONTAL_ALIGNMENT_CENTER)

func _fmt(v: float) -> String:
	var s := str(int(round(v)))
	if s.begins_with("-"):
		return "-" + _fmt(float(s.substr(1)))
	var out := ""
	var count := 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		count += 1
		if count % 3 == 0 and i > 0:
			out = "," + out
	return out
