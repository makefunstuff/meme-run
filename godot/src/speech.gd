extends Node2D
## Speech bubbles.
##
## The cast talks. Barks are attached to a node in world space so a bubble rides
## along with whoever said it, and they are budgeted: at most a handful alive at
## once, with per-speaker cooldowns, because a screen of overlapping text is
## worse than silence.

const Toy = preload("res://src/toy.gd")

const MAX_LIVE := 4
const MAX_W := 168.0
const PAD := 9.0
const TAIL := 7.0

var items: Array = []
var _cooldown := {}          ## speaker id -> time until it may talk again

func _process(delta: float) -> void:
	for it in items:
		it["life"] -= delta
	for k in _cooldown.keys():
		_cooldown[k] = float(_cooldown[k]) - delta
		if float(_cooldown[k]) <= 0.0:
			_cooldown.erase(k)
	items = items.filter(func(i): return i["life"] > 0.0 and (i["who"] == null or is_instance_valid(i["who"])))
	queue_redraw()

## Say something at a fixed world position — for speakers that are about to die.
func emit_at(pos: Vector2, text: String, opts: Dictionary = {}) -> void:
	while items.size() >= MAX_LIVE:
		items.pop_front()
	var dur: float = float(opts.get("duration", 1.7))
	items.append({
		"who": null,
		"pos": pos,
		"text": text,
		"life": dur,
		"max": dur,
		"offset": float(opts.get("offset", -40.0)),
		"colour": opts.get("colour", Color("#fff3e2")),
		"ink": opts.get("ink", Toy.INK),
	})

## Say something above `who`. Returns false when it was suppressed.
func say(who: Node2D, text: String, opts: Dictionary = {}) -> bool:
	var key: int = who.get_instance_id()
	if _cooldown.has(key):
		return false
	# one bubble per speaker at a time, and a hard cap overall
	for it in items:
		if it["who"] == who:
			return false
	while items.size() >= MAX_LIVE:
		items.pop_front()
	var dur: float = float(opts.get("duration", 1.9))
	items.append({
		"who": who,
		"pos": Vector2.ZERO,
		"text": text,
		"life": dur,
		"max": dur,
		"offset": float(opts.get("offset", -46.0)),
		"colour": opts.get("colour", Color("#fff3e2")),
		"ink": opts.get("ink", Toy.INK),
	})
	_cooldown[key] = float(opts.get("cooldown", dur * 1.6))
	return true

## Draw in world space: bubbles track their speaker as the camera moves.
func _draw() -> void:
	for it in items:
		var who = it["who"]
		var anchor_pos: Vector2
		if who == null:
			anchor_pos = it.get("pos", Vector2.ZERO)
		elif is_instance_valid(who):
			anchor_pos = who.global_position
		else:
			continue
		var life: float = it["life"]
		var max_life: float = it["max"]
		var fade_in: float = clampf((max_life - life) / 0.12, 0.0, 1.0)
		var fade_out: float = clampf(life / 0.35, 0.0, 1.0)
		var a: float = minf(fade_in, fade_out)
		if a <= 0.01:
			continue

		var lines := _wrap(it["text"], 12, MAX_W)
		var lh := 15.0
		var w := 0.0
		for ln in lines:
			w = maxf(w, ThemeDB.fallback_font.get_string_size(ln, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x)
		w += PAD * 2.0
		var h := float(lines.size()) * lh + PAD * 1.6

		var anchor: Vector2 = to_local(anchor_pos + Vector2(0, it["offset"]))
		# pop in: overshoot slightly, settle
		var pop := 0.82 + 0.18 * minf(1.0, (max_life - life) / 0.14)
		var box := Rect2(anchor - Vector2(w * 0.5, h + TAIL), Vector2(w, h))

		var col: Color = it["colour"]
		var ink: Color = it["ink"]
		col.a = a
		ink.a = a

		# tail: a triangle from the bubble's bottom edge down to the speaker
		var tail := PackedVector2Array([
			anchor + Vector2(-5.0, -TAIL),
			anchor + Vector2(5.0, -TAIL),
			anchor + Vector2(0.0, 1.0),
		])
		draw_colored_polygon(tail, col)
		draw_polyline(PackedVector2Array([tail[0], tail[2], tail[1]]), ink, 1.6, true)

		# body: soft shadow, cream fill, ink edge, then the text
		var shadow := Rect2(box.position + Vector2(0, 2), box.size)
		draw_colored_polygon(Toy.round_rect(shadow, 8.0), Color(0.08, 0.05, 0.1, 0.28 * a))
		Toy.shape(self, Toy.round_rect(box, 8.0), col, ink, 1.8)

		for i in lines.size():
			var tw: float = ThemeDB.fallback_font.get_string_size(lines[i], HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x
			Toy.text(self, Vector2(box.position.x + (w - tw) * 0.5, box.position.y + PAD + 11.0 + float(i) * lh),
				lines[i], 12, Color(0.18, 0.11, 0.2, a))

func _wrap(text: String, size: int, maxw: float) -> Array:
	var words := text.split(" ")
	var lines: Array = []
	var line := ""
	for w in words:
		var trial := w if line == "" else line + " " + w
		if ThemeDB.fallback_font.get_string_size(trial, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x > maxw and line != "":
			lines.append(line)
			line = w
		else:
			line = trial
	if line != "":
		lines.append(line)
	return lines
