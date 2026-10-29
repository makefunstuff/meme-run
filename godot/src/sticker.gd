extends Node2D
class_name Sticker
## Hosts a character's drawing. Kept as an indirection so the body can be moved
## into a CanvasGroup (sticker material, outlines, RGB split) later without
## touching any draw code. The CanvasGroup variant was abandoned because the
## group texture came back opaque, which is not worth debugging for the effect.

var skin: Node2D

func _init(painter: Callable) -> void:
	skin = load("res://src/skin.gd").new()
	skin.painter = painter
	add_child(skin)

func set_outline(_w: float) -> void:
	pass

func set_aberration(_v: float) -> void:
	pass

func redraw() -> void:
	if skin != null:
		skin.queue_redraw()
