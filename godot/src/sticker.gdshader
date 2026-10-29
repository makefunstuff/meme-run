shader_type canvas_item;
render_mode blend_premul_alpha;

// Die-cut sticker treatment, applied to a CanvasGroup around a whole character.
//
// The game is set inside a feed, so everything in it is a cut-out: a thick white
// sticker border, a hard drop shadow, and an optional RGB split that kicks in on
// damage. Doing it here means the characters keep drawing themselves from
// primitives and the sticker look is one material instead of per-shape work.

uniform vec4 outline_color : source_color = vec4(1.0, 1.0, 1.0, 1.0);
uniform float outline_width : hint_range(0.0, 10.0) = 3.0;
uniform vec4 shadow_color : source_color = vec4(0.05, 0.02, 0.08, 0.45);
uniform vec2 shadow_offset = vec2(3.0, 4.0);
uniform float aberration : hint_range(0.0, 6.0) = 0.0;

float alpha_at(vec2 uv) {
	return texture(TEXTURE, uv).a;
}

void fragment() {
	vec2 texel = TEXTURE_PIXEL_SIZE;
	vec4 col = texture(TEXTURE, UV);

	// chromatic split: red and blue pulled apart, so a hit reads as a glitch
	if (aberration > 0.01) {
		vec2 d = vec2(aberration, aberration * 0.35) * texel;
		float ar = texture(TEXTURE, UV + d).a;
		float ab = texture(TEXTURE, UV - d).a;
		col.r = texture(TEXTURE, UV + d).r;
		col.b = texture(TEXTURE, UV - d).b;
		col.a = max(col.a, max(ar, ab));
	}

	// sticker border: if this texel is empty but something is close by, it is
	// edge. Twelve samples is enough for a chunky die-cut line.
	float edge = 0.0;
	if (col.a < 0.55 && outline_width > 0.01) {
		float r = outline_width;
		for (int i = 0; i < 12; i++) {
			float a = float(i) * 0.5236;
			vec2 o = vec2(cos(a), sin(a)) * r * texel * 2.0;
			edge = max(edge, alpha_at(UV + o));
		}
		edge = step(0.4, edge);
	}

	// shadow, from the same silhouette pushed down-right
	float sa = 0.0;
	if (shadow_color.a > 0.001) {
		sa = alpha_at(UV - shadow_offset * texel * 2.0);
	}

	vec4 outc = col;
	if (edge > 0.5) {
		outc = outline_color;
		outc.a = 1.0;
	}
	// premultiplied output
	outc.rgb *= outc.a;

	vec4 sh = shadow_color;
	sh.rgb *= sh.a;
	outc = outc + sh * sa * (1.0 - outc.a);

	COLOR = outc;
}
