extends Node2D
## Draws an entity's body. Exists so the body can live inside a CanvasGroup and
## therefore receive the sticker material; the entity itself only holds logic.

var painter: Callable

func _draw() -> void:
	if painter.is_valid():
		painter.call(self)
