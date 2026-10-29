extends Control
## The interface: a single dark instrument strip, a centre banner, and the menu
## and result cards. Drawn in code so it matches the world's line weight instead
## of looking like a UI kit dropped on top of a game.

const Toy = preload("res://src/toy.gd")

var game: Node = null
var state := "menu"
var t := 0.0
var click_rects: Array = []      ## [{rect, action, arg}] rebuilt every draw
var hover := Vector2(-100, -100)
var menu_mode := "classic"
var banner_text := ""
var banner_sub := ""
var banner_t := 0.0
var toast_text := ""
var toast_t := 0.0

const MODES := [
	["classic", "CLASSIC", "the standard doomscroll"],
	["degen", "DEGEN", "market open · x2 p&l"],
	["chaos", "CHAOS", "everything is too much"],
	["ohio", "OHIO", "physics is a lie"],
]

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP

func show_banner(main: String, sub: String) -> void:
	banner_text = main
	banner_sub = sub
	banner_t = 2.6

func show_toast(s: String) -> void:
	toast_text = s
	toast_t = 2.4

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
					menu_mode = MODES[i][0]
					if game != null:
						game.world.set_mode(menu_mode)
						game.set_mode(menu_mode)
		elif state == "over":
			if event.keycode == KEY_ENTER or event.keycode == KEY_SPACE or event.keycode == KEY_R:
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

# ------------------------------------------------------------------ draw ----

func _draw() -> void:
	click_rects.clear()
	var size := get_viewport_rect().size
	if state == "menu":
		_draw_menu(size)
		return
	_draw_hud(size)
	if state == "over":
		_draw_over(size)
	elif game != null and game.paused:
		_draw_pause(size)

func _panel(rect: Rect2, alpha: float = 0.92) -> void:
	Toy.shape(self, Toy.round_rect(rect, 10.0), Color(0.07, 0.05, 0.11, alpha * 0.88), Color(0.42, 0.34, 0.52, 0.85), 1.4)

func _button(rect: Rect2, label: String, action: String, arg, selected: bool = false) -> void:
	var font := ThemeDB.fallback_font
	var hot := rect.has_point(hover)
	var base := Color(0.13, 0.11, 0.20, 0.95)
	var edge := Color(0.38, 0.32, 0.48, 0.9)
	if selected:
		base = Color(0.11, 0.34, 0.22, 0.95)
		edge = Color(0.35, 0.95, 0.55, 1.0)
	if hot:
		base = base.lightened(0.16)
	Toy.shape(self, Toy.round_rect(rect, 8.0), base, edge, 1.6)
	var w := font.get_string_size(label, HORIZONTAL_ALIGNMENT_LEFT, -1, 16).x
	Toy.text(self, Vector2(rect.position.x + (rect.size.x - w) * 0.5, rect.position.y + 24),
		label, 16, Color(0.95, 0.97, 1.0) if not selected else Color(0.7, 1.0, 0.8))
	click_rects.append({"rect": rect, "action": action, "arg": arg})

# ------------------------------------------------------------------- menu ---

func _draw_menu(size: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.03, 0.02, 0.06, 0.55))
	var card_w := minf(760.0, size.x - 60.0)
	var card := Rect2((size.x - card_w) * 0.5, size.y * 0.12, card_w, size.y * 0.76)
	_panel(card, 1.0)
	# accent strip
	draw_rect(Rect2(card.position.x, card.position.y, card.size.x, 3.0), Color(0.35, 0.95, 0.55))
	draw_rect(Rect2(card.position.x + card.size.x * 0.6, card.position.y, card.size.x * 0.4, 3.0), Color(0.95, 0.35, 0.6))

	var font := ThemeDB.fallback_font
	var cx := size.x * 0.5
	Toy.text(self, Vector2(cx - 190, card.position.y + 96), "MEME", 64, Color(0.55, 1.0, 0.72), HORIZONTAL_ALIGNMENT_LEFT, 8, Color(0.05, 0.25, 0.12))
	Toy.text(self, Vector2(cx + 22, card.position.y + 96), "RUN", 64, Color(1.0, 0.95, 0.98), HORIZONTAL_ALIGNMENT_LEFT, 8, Color(0.25, 0.05, 0.15))
	Toy.text(self, Vector2(cx - 187, card.position.y + 124), "GODOT EDITION · NOT FINANCIAL ADVICE", 12,
		Color(0.62, 0.72, 0.66))

	var blurb := "The Algorithm is chasing you and the market is open.\nOutrun the feed, shoot the memes, leave with the bag."
	var lines := blurb.split("\n")
	for i in lines.size():
		var w := font.get_string_size(lines[i], HORIZONTAL_ALIGNMENT_LEFT, -1, 15).x
		Toy.text(self, Vector2(cx - w * 0.5, card.position.y + 160 + i * 22), lines[i], 15, Color(0.80, 0.84, 0.92))

	# mode grid
	var gx := card.position.x + 34
	var gy := card.position.y + 210
	var bw := (card.size.x - 68.0 - 24.0) * 0.5
	var bh := 54.0
	for i in MODES.size():
		var m: Array = MODES[i]
		var r := Rect2(gx + (bw + 24.0) * float(i % 2), gy + (bh + 12.0) * float(i / 2), bw, bh)
		_button(r, String(m[1]), "mode", m[0], menu_mode == String(m[0]))
		Toy.text(self, Vector2(r.position.x + 14, r.position.y + r.size.y - 8), String(m[2]), 10,
			Color(0.62, 0.68, 0.78))

	# start
	var start_r := Rect2(cx - 190, gy + bh * 2.0 + 46.0, 380, 56)
	_button(start_r, "OPEN THE POSITION", "start", menu_mode, true)

	var help := "A / D  move     SPACE  jump (double)     SHIFT  dash     J / left click  shoot"
	var hw := font.get_string_size(help, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x
	Toy.text(self, Vector2(cx - hw * 0.5, card.position.y + card.size.y - 26), help, 12, Color(0.66, 0.7, 0.8))

# -------------------------------------------------------------------- hud ---

func _draw_hud(size: Vector2) -> void:
	if game == null:
		return
	var font := ThemeDB.fallback_font

	# logo
	Toy.text(self, Vector2(26, 40), "MEME", 22, Color(0.55, 1.0, 0.72), HORIZONTAL_ALIGNMENT_LEFT, 5, Color(0.05, 0.25, 0.12))
	Toy.text(self, Vector2(88, 40), "RUN", 22, Color(1.0, 0.95, 0.98), HORIZONTAL_ALIGNMENT_LEFT, 5, Color(0.25, 0.05, 0.15))
	Toy.text(self, Vector2(27, 56), "%s RUN · NOT FINANCIAL ADVICE" % game.mode.to_upper(), 10, Color(0.7, 0.78, 0.86))

	# combo
	if game.combo >= 2:
		var cw := 96.0
		var cr := Rect2(26, 68, cw, 22)
		var pulse := 1.0 + 0.12 * sin(t * 12.0)
		Toy.shape(self, Toy.round_rect(cr, 11.0), Color(0.1, 0.35, 0.2, 0.9), Color(0.4, 1.0, 0.6), 1.4)
		Toy.text(self, Vector2(cr.position.x + 10, cr.position.y + 16), "x%d COMBO" % game.combo, int(11 * pulse), Color(0.7, 1.0, 0.75))

	# instrument strip, top right
	var cell_h := 46.0
	var pad := 6.0
	var cells := [
		["P&L", "$" + _fmt(game.pnl), Color(0.55, 1.0, 0.7)],
		["METRES", str(int(game.dist)), Color(0.95, 0.97, 1.0)],
		["BAG", str(game.bag), Color(0.95, 0.88, 0.6)],
		["WEAPON", game.weapon_label()],
	]
	var cell_w: Array = [104.0, 78.0, 62.0, 112.0, 74.0]
	var total := 0.0
	for w in cell_w:
		total += w
	var strip := Rect2(size.x - total - 22, 20, total, cell_h)
	Toy.shape(self, Toy.round_rect(strip, 12.0), Color(0.07, 0.05, 0.11, 0.9), Color(0.36, 0.30, 0.46, 0.9), 1.4)
	var x := strip.position.x
	for i in cells.size():
		var w2: float = cell_w[i]
		if i > 0:
			draw_line(Vector2(x, strip.position.y + 8), Vector2(x, strip.position.y + cell_h - 8), Color(0.32, 0.27, 0.42, 0.8), 1.0)
		var label: String = cells[i][0]
		var value: String = cells[i][1]
		var vc: Color = cells[i][2] if cells[i].size() > 2 else Color(0.95, 0.97, 1.0)
		Toy.text(self, Vector2(x + 10, strip.position.y + 15), label, 9, Color(0.6, 0.66, 0.78))
		Toy.text(self, Vector2(x + 10, strip.position.y + 36), value, 17, vc)
		x += w2

	# hearts
	var hx := x + 12
	for i in game.player.max_health:
		var filled: bool = i < game.player.health
		Toy.heart(self, Vector2(hx + i * 20, strip.position.y + cell_h * 0.5),
			9.0, Toy.RED if filled else Color(0.3, 0.24, 0.32))

	# dash cooldown pip under the strip
	var p: Node2D = game.player
	if p != null:
		var frac: float = 1.0 - clampf(p.dash_cd / p.DASH_CD, 0.0, 1.0)
		var dr := Rect2(strip.position.x, strip.position.y + cell_h + 6, total, 5)
		draw_rect(dr, Color(0.1, 0.08, 0.15, 0.8))
		draw_rect(Rect2(dr.position, Vector2(dr.size.x * frac, dr.size.y)),
			Toy.MINT if frac >= 1.0 else Color(0.6, 0.7, 0.9))

	# boss bar
	if game.boss != null and is_instance_valid(game.boss) and not game.boss.dead:
		var bw := minf(560.0, size.x - 200.0)
		var br := Rect2((size.x - bw) * 0.5, size.y - 54, bw, 12)
		var frac2 := clampf(float(game.boss.hp) / float(game.boss.max_hp), 0.0, 1.0)
		draw_rect(Rect2(br.position - Vector2(2, 2), br.size + Vector2(4, 4)), Color(0.05, 0.03, 0.08, 0.85))
		draw_rect(br, Color(0.14, 0.08, 0.18))
		draw_rect(Rect2(br.position, Vector2(bw * frac2, br.size.y)), Toy.PINK)
		var name := "THE ALGORITHM"
		var nw := font.get_string_size(name, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x
		Toy.text(self, Vector2((size.x - nw) * 0.5, br.position.y - 8), name, 12, Color(0.95, 0.9, 1.0))

	# banner
	if banner_t > 0.0:
		var a := clampf(banner_t / 0.4, 0.0, 1.0)
		var bw2 := 420.0
		var r2 := Rect2((size.x - bw2) * 0.5, 120, bw2, 68)
		Toy.shape(self, Toy.round_rect(r2, 8.0), Color(0.10, 0.06, 0.16, 0.92 * a),
			Color(0.35, 0.95, 0.55, a), 2.0)
		Toy.text(self, Vector2(size.x * 0.5, r2.position.y + 34), banner_text, 26, Color(1, 1, 1, a),
			HORIZONTAL_ALIGNMENT_CENTER)
		Toy.text(self, Vector2(size.x * 0.5, r2.position.y + 54), banner_sub, 12, Color(0.75, 0.8, 0.9, a),
			HORIZONTAL_ALIGNMENT_CENTER)

	# toast
	if toast_t > 0.0:
		var a2 := clampf(toast_t / 0.4, 0.0, 1.0)
		var tw := font.get_string_size(toast_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 14).x
		var tr := Rect2((size.x - tw) * 0.5 - 14, 74, tw + 28, 30)
		Toy.shape(self, Toy.round_rect(tr, 8.0), Color(0.08, 0.06, 0.12, 0.9 * a2), Color(0.4, 0.95, 0.6, a2), 1.4)
		Toy.text(self, Vector2(size.x * 0.5, tr.position.y + 20), toast_text, 14, Color(0.92, 0.96, 1.0, a2),
			HORIZONTAL_ALIGNMENT_CENTER)

func _draw_over(size: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.03, 0.02, 0.06, 0.62))
	var card_w := minf(560.0, size.x - 60.0)
	var card := Rect2((size.x - card_w) * 0.5, size.y * 0.22, card_w, 330)
	_panel(card, 1.0)
	draw_rect(Rect2(card.position.x, card.position.y, card.size.x, 3.0), Color(1.0, 0.4, 0.55))
	var cx := size.x * 0.5
	Toy.text(self, Vector2(cx, card.position.y + 52), "LIQUIDATED", 40, Color(1.0, 0.55, 0.65),
		HORIZONTAL_ALIGNMENT_CENTER, 7, Color(0.25, 0.05, 0.12))
	Toy.text(self, Vector2(cx, card.position.y + 78), game.death_line, 13, Color(0.78, 0.82, 0.9),
		HORIZONTAL_ALIGNMENT_CENTER)

	var rows := [
		["P&L", "$" + _fmt(game.pnl)],
		["METRES", str(int(game.dist))],
		["KILLS", str(game.kills)],
		["BAG", str(game.bag)],
		["BEST COMBO", "x" + str(game.best_combo)],
	]
	for i in rows.size():
		var y := card.position.y + 118 + i * 26
		Toy.text(self, Vector2(card.position.x + 40, y), rows[i][0], 13, Color(0.6, 0.66, 0.78))
		Toy.text(self, Vector2(card.end.x - 40, y), rows[i][1], 16, Color(0.95, 0.97, 1.0), HORIZONTAL_ALIGNMENT_RIGHT)

	var best_txt := "ALL-TIME HIGH  $%s" % _fmt(game.best)
	Toy.text(self, Vector2(cx, card.position.y + 268), best_txt, 13, Color(0.7, 0.9, 0.75), HORIZONTAL_ALIGNMENT_CENTER)

	var r := Rect2(cx - 150, card.end.y - 58, 300, 46)
	_button(r, "RUN IT BACK", "restart", null, true)

func _draw_pause(size: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color(0.03, 0.02, 0.06, 0.6))
	var cx := size.x * 0.5
	Toy.text(self, Vector2(cx, size.y * 0.45), "PAUSED", 46, Color(0.95, 0.97, 1.0), HORIZONTAL_ALIGNMENT_CENTER, 6, Color(0.1, 0.06, 0.14))
	Toy.text(self, Vector2(cx, size.y * 0.45 + 34), "ESC to resume", 14, Color(0.72, 0.78, 0.9), HORIZONTAL_ALIGNMENT_CENTER)

func _fmt(v: float) -> String:
	var s := str(int(round(v)))
	var out := ""
	var count := 0
	for i in range(s.length() - 1, -1, -1):
		out = s[i] + out
		count += 1
		if count % 3 == 0 and i > 0 and s[i - 1] != "-":
			out = "," + out
	return out
