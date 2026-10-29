extends Node2D
## Meme Run — Godot edition.
##
## Owns the run: difficulty ramp, spawning, combo, the market numbers, the boss
## cadence, camera, shake, hitstop, and the transitions between menu, run, pause
## and results. Entities are plain Node2Ds driven by hand rather than physics
## bodies, because this game needs deterministic, tunable feel rather than
## simulation, and because it has to fit in a web build.

const WorldScript = preload("res://src/world.gd")
const PlayerScript = preload("res://src/player.gd")
const EnemyScript = preload("res://src/enemy.gd")
const BulletScript = preload("res://src/bullet.gd")
const PickupScript = preload("res://src/pickup.gd")
const BossScript = preload("res://src/boss.gd")
const HudScript = preload("res://src/hud.gd")
const FxScript = preload("res://src/fx.gd")
const Toy = preload("res://src/toy.gd")

const BOSS_EVERY := 1100.0
const START_SPEED := 330.0
const MAX_SPEED := 620.0

enum { ST_MENU, ST_PLAY, ST_OVER }

var view := Vector2(1280, 720)
var ground_y := 560.0
var mode := "classic"
var state := ST_MENU
var paused := false

var world: Node2D
var backdrop: CanvasLayer
var entities: Node2D
var player: Node2D
var camera: Camera2D
var fx: Node2D
var hud: Control

var enemies: Array = []
var bullets: Array = []
var ebullets: Array = []
var pickups: Array = []
var boss: Node2D = null

var dist := 0.0
var run_speed := START_SPEED
var bag := 0
var pnl := 0.0
var kills := 0
var combo := 0
var best_combo := 0
var combo_t := 0.0
var best := 0
var death_line := "Your brainrot has been fully monetized."
var labels_on := true

var spawn_t := 0.0
var pickup_t := 0.0
var next_boss := BOSS_EVERY
var boss_kills := 0
var time_scale_target := 1.0

var shake_amt := 0.0
var hitstop_until := 0
var autoplay := false

const DEATH_LINES := [
	"Your brainrot has been fully monetized.",
	"The algorithm won. You are an NPC now.",
	"Your aura has been liquidated for parts.",
	"Ratio'd into the void at 3am.",
	"The economy ate your last brain cell.",
	"You have been archived. Unsubscribed from life.",
	"Liquidated at 100x. Skill issue.",
	"Your bag is now the community's bag.",
]

# ------------------------------------------------------------------- boot ---

func _ready() -> void:
	randomize()
	_setup_input()
	# The design resolution is fixed and the canvas scales to it. Without this the
	# HiDPI display doubles the viewport height and every proportion drifts.
	var win := get_window()
	win.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
	win.content_scale_aspect = Window.CONTENT_SCALE_ASPECT_EXPAND
	win.content_scale_size = Vector2i(1280, 720)
	if not OS.has_feature("web"):
		win.size = Vector2i(1280, 720)
	view = get_viewport().get_visible_rect().size
	ground_y = view.y * 0.78

	backdrop = CanvasLayer.new()
	backdrop.name = "Backdrop"
	backdrop.layer = -10
	add_child(backdrop)
	world = WorldScript.new()
	world.name = "World"
	backdrop.add_child(world)

	entities = Node2D.new()
	entities.name = "Entities"
	add_child(entities)

	camera = Camera2D.new()
	camera.name = "Camera"
	camera.position = Vector2(view.x * 0.4, view.y * 0.5)
	add_child(camera)
	camera.make_current()

	fx = FxScript.new()
	fx.name = "Fx"
	add_child(fx)

	var layer := CanvasLayer.new()
	layer.layer = 10
	add_child(layer)
	hud = HudScript.new()
	hud.game = self
	layer.add_child(hud)

	_load_best()
	world.set_mode(mode)
	_make_attract_player()
	_handle_cli()

func _setup_input() -> void:
	_bind("jump", [KEY_SPACE, KEY_W, KEY_UP])
	_bind("dash", [KEY_SHIFT])
	_bind("shoot", [KEY_J, KEY_F])
	_bind("move_left", [KEY_A, KEY_LEFT])
	_bind("move_right", [KEY_D, KEY_RIGHT])
	# the mouse also shoots, for people who expect that
	if not InputMap.has_action("shoot"):
		return
	var mb := InputEventMouseButton.new()
	mb.button_index = MOUSE_BUTTON_LEFT
	InputMap.action_add_event("shoot", mb)

func _bind(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for k in keys:
		var ev := InputEventKey.new()
		ev.physical_keycode = k
		InputMap.action_add_event(action, ev)

## A player that exists only to idle on the menu backdrop.
func _make_attract_player() -> void:
	player = PlayerScript.new()
	player.setup(self, ground_y)
	player.position = Vector2(view.x * 0.42, ground_y - 17.0)
	player.health = player.max_health
	entities.add_child(player)

func is_running() -> bool:
	return state == ST_PLAY and not paused

# ------------------------------------------------------------------ modes ---

func set_mode(m: String) -> void:
	mode = m
	if world != null:
		world.set_mode(m)

# ------------------------------------------------------------------- run ---

func start_run(m: String) -> void:
	set_mode(m)
	_clear_all()
	state = ST_PLAY
	paused = false
	dist = 0.0
	run_speed = START_SPEED
	bag = 0
	pnl = 0.0
	kills = 0
	combo = 0
	best_combo = 0
	boss_kills = 0
	next_boss = BOSS_EVERY
	spawn_t = 1.2
	pickup_t = 1.0
	shake_amt = 0.0

	player = PlayerScript.new()
	player.setup(self, ground_y)
	player.position = Vector2(220, ground_y - 17.0)
	entities.add_child(player)
	player.died.connect(_on_player_died)

	hud.state = "play"
	hud.show_banner("%s RUN" % mode.to_upper(), _mode_sub(m))
	emit_fx("start", player.global_position)
	if m == "degen":
		run_speed = START_SPEED * 1.1
	elif m == "chaos":
		run_speed = START_SPEED * 1.15
	elif m == "ohio":
		run_speed = START_SPEED * 1.05

func _mode_sub(m: String) -> String:
	match m:
		"degen": return "market open, everything is leverage"
		"chaos": return "everything is too much"
		"ohio": return "physics has left the chat"
		_: return "the standard doomscroll"

func restart() -> void:
	start_run(mode)

func toggle_pause() -> void:
	if state != ST_PLAY:
		return
	paused = not paused
	get_tree().paused = paused
	paused = paused

func _clear_all() -> void:
	for n in entities.get_children():
		n.queue_free()
	enemies.clear()
	bullets.clear()
	ebullets.clear()
	pickups.clear()
	boss = null

func _on_player_died() -> void:
	state = ST_OVER
	death_line = DEATH_LINES[randi() % DEATH_LINES.size()]
	if pnl > best:
		best = int(pnl)
		_save_best()
	hud.state = "over"
	shake(16.0)

# ------------------------------------------------------------- spawn loop ---

func _process(delta: float) -> void:
	var dt := delta
	# hitstop: a few frames of frozen time on a heavy hit. Uses wall clock so it
	# is immune to its own time scaling.
	if hitstop_until > Time.get_ticks_msec():
		Engine.time_scale = 0.06
	else:
		Engine.time_scale = 1.0

	_update_camera(delta)

	if state == ST_MENU:
		world.scroll += 40.0 * delta
		if player != null:
			player.position.x = view.x * 0.42
		return

	if state != ST_PLAY or paused:
		return

	dist += run_speed * delta * 0.06
	run_speed = minf(MAX_SPEED, START_SPEED + dist * 0.045)
	world.scroll += run_speed * delta
	pnl += (run_speed * delta * 0.02) * (2.0 if mode == "degen" else 1.0)

	combo_t = maxf(0.0, combo_t - delta)
	if combo_t <= 0.0 and combo > 0:
		combo = 0

	# spawn enemies: faster and nastier as the run goes on
	spawn_t -= delta
	if spawn_t <= 0.0:
		var gap: float = maxf(0.34, 1.12 - dist / 2600.0)
		if mode == "chaos":
			gap *= 0.7
		elif mode == "degen":
			gap *= 0.85
		spawn_t = gap * randf_range(0.75, 1.25)
		_spawn_wave()

	pickup_t -= delta
	if pickup_t <= 0.0:
		pickup_t = randf_range(1.4, 2.4)
		_spawn_pickup()

	if boss == null and dist >= next_boss:
		_spawn_boss()

	if player != null and not player.dead:
		if player.global_position.y > view.y + 200.0:
			player.hurt(player.global_position)

func _spawn_wave() -> void:
	var roll := randf()
	var kinds: Array = ["walker", "walker", "flyer"]
	if dist > 120:
		kinds.append("shooter")
	if dist > 220:
		kinds.append("charger")
	if dist > 340:
		kinds.append("splitter")
	if dist > 460:
		kinds.append("brute")
	if dist > 600:
		kinds.append("drifter")
	var kind: String = kinds[randi() % kinds.size()]
	# spawn ahead of the PLAYER, not at a fixed world x: a fixed x means the run
	# goes quiet forever once you have travelled past it
	var x := _ahead(1.05)
	var y := ground_y - 20.0
	if kind == "flyer" or kind == "drifter":
		y = ground_y - randf_range(110.0, 210.0)
	# small groups once the run is warm
	var count := 1
	if dist > 260 and roll > 0.62:
		count = 2
	if mode == "chaos":
		count += 1
	for i in count:
		spawn_enemy(kind, Vector2(x + i * randf_range(40.0, 90.0), y))

func spawn_enemy(kind: String, pos: Vector2, scale_mul: float = 1.0) -> Node2D:
	var e := EnemyScript.new()
	e.setup(self, kind, pos, scale_mul)
	entities.add_child(e)
	enemies.append(e)
	return e

## A world x comfortably off the right edge of the screen, relative to the player.
func _ahead(factor: float) -> float:
	var base: float = player.global_position.x if player != null else camera.position.x
	return base + view.x * factor

func _spawn_pickup() -> void:
	var x := _ahead(0.95)
	var roll := randf()
	# coins in readable arcs, so collecting them is a rhythm and not a lottery
	if roll < 0.62:
		var n := randi_range(3, 6)
		var y0 := ground_y - randf_range(60.0, 150.0)
		for i in n:
			var p := PickupScript.new()
			p.setup(self, "coin", Vector2(x + i * 42.0, y0 - sin(float(i) / float(n) * PI) * 46.0))
			entities.add_child(p)
			pickups.append(p)
	elif roll < 0.74:
		var p2 := PickupScript.new()
		p2.setup(self, "gem", Vector2(x, ground_y - 120.0), {"value": 5})
		entities.add_child(p2)
		pickups.append(p2)
	elif roll < 0.84:
		var p3 := PickupScript.new()
		p3.setup(self, "heart", Vector2(x, ground_y - 110.0))
		entities.add_child(p3)
		pickups.append(p3)
	elif roll < 0.92:
		var p4 := PickupScript.new()
		p4.setup(self, "shield", Vector2(x, ground_y - 120.0))
		entities.add_child(p4)
		pickups.append(p4)
	else:
		var keys: Array = ["bread", "prism", "void", "sus", "moon", "pump", "lever", "drop"]
		var p5 := PickupScript.new()
		p5.setup(self, "crate", Vector2(x, ground_y - 100.0), {"weapon": keys[randi() % keys.size()]})
		entities.add_child(p5)
		pickups.append(p5)

func _spawn_boss() -> void:
	next_boss += BOSS_EVERY
	boss_kills += 1
	boss = BossScript.new()
	boss.setup(self, Vector2(view.x * 0.55 + 200.0, ground_y - 150.0))
	entities.add_child(boss)
	hud.show_banner("THE ALGORITHM", "it has come to personalise you")
	shake(10.0)

func on_enemy_killed(e: Node2D, coins: int) -> void:
	kills += 1
	combo += 1
	combo_t = 2.6
	best_combo = maxi(best_combo, combo)
	var mult := 1.0 + float(combo) * 0.12
	pnl += 14.0 * mult * (2.0 if mode == "degen" else 1.0)
	emit_fx("coins", e.global_position, {"coins": coins})
	fx.text(e.global_position + Vector2(0, -30), "+$" + str(int(14 * mult)), Toy.GOLD, 16)
	if combo > 0 and combo % 5 == 0:
		shake(4.0)
		fx.text(e.global_position + Vector2(0, -54), "x%d" % combo, Toy.MINT, 20)

func on_boss_killed(_b: Node2D) -> void:
	boss = null
	combo += 3
	pnl += 400.0
	bag += 40
	hud.show_banner("ALGORITHM DEFRAGMENTED", "+400 aura, the feed is briefly honest")
	fx.text(player.global_position + Vector2(0, -60), "+$400", Toy.MINT, 26)
	shake(24.0)

func on_pickup(p: Node2D) -> void:
	match p.kind:
		"coin":
			bag += 1
			pnl += 6.0
			emit_fx("coin", p.global_position)
		"gem":
			bag += p.value
			pnl += 40.0
			emit_fx("coin", p.global_position)
			fx.text(p.global_position, "+$40", Toy.PINK, 18)
		"heart":
			player.heal(1)
			emit_fx("heal", p.global_position)
			fx.text(p.global_position, "+1 HP", Toy.RED, 18)
		"shield":
			player.heal(2)
			player.invuln = maxf(player.invuln, 1.4)
			emit_fx("heal", p.global_position)
			fx.text(p.global_position, "SHIELDED", Toy.BLUE, 18)
		"crate":
			player.weapon = p.weapon
			player.ammo = int(player.WEAPONS[p.weapon]["ammo"])
			emit_fx("crate", p.global_position)
			hud.show_toast(weapon_label() + " ONLINE")

func on_bullet_gone(b: Node2D) -> void:
	bullets.erase(b)

# ------------------------------------------------------------------- combat --

func spawn_bullet(pos: Vector2, vel: Vector2, w: Dictionary, _from: Node) -> void:
	var b := BulletScript.new()
	b.setup(self, pos, vel, w, true)
	entities.add_child(b)
	bullets.append(b)

func spawn_ebullet(pos: Vector2, vel: Vector2) -> void:
	var b := BulletScript.new()
	b.setup(self, pos, vel, {"kind": "enemy", "dmg": 1}, false)
	entities.add_child(b)
	ebullets.append(b)

func explode(pos: Vector2, radius: float, dmg: int) -> void:
	emit_fx("explosion", pos, {"radius": radius})
	shake(9.0)
	for e in enemies.duplicate():
		if is_instance_valid(e) and not e.dead and e.global_position.distance_to(pos) < radius:
			e.apply_hit(dmg, (e.global_position - pos).normalized() * 200.0)
	if boss != null and is_instance_valid(boss) and not boss.dead:
		if boss.global_position.distance_to(pos) < radius + 50.0:
			boss.apply_hit(dmg, (boss.global_position - pos).normalized())

func weapon_label() -> String:
	if player == null:
		return "BLASTER"
	var w: Dictionary = player.WEAPONS.get(player.weapon, player.WEAPONS["blaster"])
	var label: String = w["label"]
	if player.ammo > 0:
		label += " " + str(player.ammo)
	return label

# --------------------------------------------------------------------- feel ---

func shake(amount: float) -> void:
	shake_amt = maxf(shake_amt, amount)

func hitstop(seconds: float) -> void:
	hitstop_until = maxi(hitstop_until, Time.get_ticks_msec() + int(seconds * 1000.0))

func _update_camera(delta: float) -> void:
	if player == null:
		return
	var target := Vector2(player.global_position.x + view.x * 0.12, view.y * 0.5)
	# a little lookahead toward where you are shooting, so the screen leans in
	if player.aim.x > 0.3:
		target.x += 26.0
	camera.position = camera.position.lerp(target, clampf(delta * 6.0, 0.0, 1.0))
	shake_amt = maxf(0.0, shake_amt - delta * 42.0)
	var off := Vector2(randf_range(-1, 1), randf_range(-1, 1)) * shake_amt
	camera.offset = off
	# the backdrop is a CanvasLayer, so it has to be shaken by hand or the world
	# slides underneath a still sky
	if world != null:
		world.position = off

# ---------------------------------------------------------------------- fx ---

func emit_fx(kind: String, pos: Vector2, opts: Dictionary = {}) -> void:
	match kind:
		"jump":
			fx.burst(pos + Vector2(0, 16), 7, Color(0.85, 0.92, 1.0), 170.0, 3.0, 0.35, 700.0, PI)
			fx.ring(pos + Vector2(0, 16), 6.0, 26.0, Color(1, 1, 1, 0.5), 0.26, 2.0)
		"double_jump":
			fx.burst(pos + Vector2(0, 12), 10, Toy.MINT, 230.0, 3.5, 0.4, 500.0)
			fx.ring(pos + Vector2(0, 10), 8.0, 34.0, Toy.MINT, 0.3, 2.4)
		"land":
			fx.burst(pos + Vector2(0, -4), 9, Color(0.9, 0.95, 1.0), 190.0, 3.0, 0.3, 900.0, PI)
		"dash":
			fx.ring(pos, 10.0, 44.0, Toy.PINK_L, 0.28, 2.6)
			fx.burst(pos, 12, Toy.PINK_L, 260.0, 3.0, 0.35, 200.0)
		"muzzle":
			var dir: Vector2 = opts.get("dir", Vector2.RIGHT)
			var w: String = opts.get("weapon", "blaster")
			var col := Toy.BLUE_L
			if w == "moon": col = Toy.PINK_L
			elif w == "prism": col = Toy.BLUE
			elif w == "void": col = Toy.LILAC
			elif w == "bread": col = Color("#e8b072")
			elif w == "pump": col = Toy.MINT
			fx.burst(pos, 4, col, 200.0, 2.2, 0.18, 120.0, 0.8, dir.angle())
			fx.ring(pos, 3.0, 12.0, col, 0.13, 1.6)
		"hit":
			var d: Vector2 = opts.get("dir", Vector2.RIGHT)
			var c: Color = opts.get("colour", Toy.WHITE)
			fx.burst(pos, 6, c, 240.0, 2.8, 0.28, 400.0, 1.5, d.angle() + PI)
			fx.ring(pos, 4.0, 16.0, Color(c.r, c.g, c.b, 0.7), 0.18, 1.6)
		"enemy_death":
			var c2: Color = opts.get("colour", Toy.MINT)
			fx.burst(pos, 16, c2, 320.0, 4.5, 0.55, 780.0)
			fx.ring(pos, 8.0, 46.0, Color(c2.r, c2.g, c2.b, 0.8), 0.34, 3.0)
		"hurt":
			fx.burst(pos, 18, Toy.RED, 340.0, 4.0, 0.5, 620.0)
			fx.ring(pos, 10.0, 56.0, Toy.RED, 0.4, 3.0)
		"death":
			fx.burst(pos, 34, Toy.PINK, 460.0, 5.0, 0.9, 800.0)
			fx.burst(pos, 18, Toy.GOLD, 380.0, 4.0, 0.8, 700.0)
			fx.ring(pos, 12.0, 120.0, Toy.PINK_L, 0.6, 4.0)
		"coins":
			var n: int = opts.get("coins", 2)
			fx.burst(pos, 4 + n * 2, Toy.GOLD, 260.0, 3.4, 0.6, 700.0)
			fx.ring(pos, 6.0, 30.0, Toy.GOLD, 0.3, 2.0)
		"coin":
			fx.burst(pos, 4, Toy.GOLD, 170.0, 2.6, 0.4, 400.0)
		"heal":
			fx.burst(pos, 10, Toy.MINT, 200.0, 3.4, 0.6, -80.0)
			fx.ring(pos, 8.0, 40.0, Toy.MINT, 0.4, 2.4)
		"crate":
			fx.burst(pos, 14, Toy.MINT, 280.0, 4.0, 0.6, 600.0)
			fx.ring(pos, 8.0, 48.0, Toy.MINT, 0.4, 2.6)
		"explosion":
			var r: float = opts.get("radius", 70.0)
			fx.burst(pos, 26, Toy.GOLD, 420.0, 5.0, 0.6, 700.0)
			fx.burst(pos, 14, Toy.RED, 340.0, 4.5, 0.5, 500.0)
			fx.ring(pos, 10.0, r, Color(1, 0.9, 0.6, 0.9), 0.36, 4.0)
		"slam":
			fx.ring(pos, 20.0, 220.0, Color(1, 0.85, 0.7, 0.85), 0.45, 5.0)
			fx.burst(pos, 26, Color(0.85, 0.75, 0.6), 420.0, 5.0, 0.6, 900.0, PI)
		"summon":
			fx.ring(pos, 20.0, 90.0, Toy.LILAC, 0.5, 3.0)
		"start":
			fx.ring(pos, 16.0, 120.0, Toy.MINT, 0.6, 4.0)

# ------------------------------------------------------------------- save ---

func _load_best() -> void:
	var cfg := ConfigFile.new()
	if cfg.load("user://meme_run.cfg") == OK:
		best = int(cfg.get_value("score", "best", 0))
		if cfg.has_section_key("score", "mode"):
			mode = String(cfg.get_value("score", "mode", "classic"))

func _save_best() -> void:
	var cfg := ConfigFile.new()
	cfg.set_value("score", "best", best)
	cfg.set_value("score", "mode", mode)
	cfg.save("user://meme_run.cfg")

# --------------------------------------------------------------- cli shots ---
# A capture harness so frames can be reviewed without a compositor: `--shot=path`
# starts a run, autoplays, saves one PNG and quits.

func _handle_cli() -> void:
	var args := OS.get_cmdline_user_args()
	for a in args:
		if a.begins_with("--shot="):
			_capture_run(a.substr(7), 1)
		elif a.begins_with("--seq="):
			_capture_run(a.substr(6), 6)
		elif a.begins_with("--mode="):
			start_run(a.substr(7))
		elif a.begins_with("--spawn="):
			_spawn_lineup(a.substr(8))

## Put one of every archetype on screen, for reviewing the cast.
func _spawn_lineup(list: String) -> void:
	if state != ST_PLAY:
		start_run(mode)
	var kinds: PackedStringArray = list.split(",")
	var i := 0
	for k in kinds:
		var y := ground_y - 26.0
		if k in ["flyer", "drifter"]:
			y = ground_y - 150.0
		spawn_enemy(k, Vector2(520.0 + i * 96.0, y))
		i += 1

func _capture_run(dir_path: String, count: int) -> void:
	autoplay = true
	if state != ST_PLAY:
		start_run(mode)
	await get_tree().create_timer(1.6).timeout
	for i in count:
		if count > 1:
			await get_tree().create_timer(0.9).timeout
		await RenderingServer.frame_post_draw
		var img := get_viewport().get_texture().get_image()
		var path := dir_path if count == 1 else "%s_%02d.png" % [dir_path.trim_suffix(".png"), i]
		img.save_png(path)
		print("saved ", path, " ", img.get_size())
		print("  window=", DisplayServer.window_get_size(), " node_size=", get_window().size,
			" content_scale=", get_window().content_scale_size,
			" visible=", get_viewport().get_visible_rect().size,
			" screen_scale=", DisplayServer.screen_get_scale())
	if count == 1:
		get_tree().quit()

## Very small autoplayer for the harness: jump when something is close, draw.
func _autoplay_step(delta: float) -> void:
	if player == null or player.dead:
		return
	var want_jump := false
	for e in enemies:
		if is_instance_valid(e) and e.global_position.x - player.global_position.x < 190.0 \
		and e.global_position.x > player.global_position.x:
			want_jump = true
	if want_jump and player.grounded and randf() < 0.35:
		player.vel.y = player.JUMP_V
		player.grounded = false
	if randf() < 0.6:
		player._try_shoot()

func _physics_process(delta: float) -> void:
	if autoplay and state == ST_PLAY:
		_autoplay_step(delta)
