shader_type canvas_item;

// The sky, generated on the GPU.
//
// The first version drew it from GDScript: a 40-band gradient plus a halftone
// dot loop plus scanlines. That loop alone was ~3800 individual draw commands
// per frame — 43% of every frame's draw calls, and the reason the game ran at
// single-digit FPS. All of it is one textured rectangle now.

uniform vec4 c0 : source_color = vec4(0.04, 0.02, 0.09, 1.0);
uniform vec4 c1 : source_color = vec4(0.16, 0.06, 0.24, 1.0);
uniform vec4 c2 : source_color = vec4(0.42, 0.12, 0.34, 1.0);
uniform vec4 c3 : source_color = vec4(0.82, 0.24, 0.39, 1.0);
uniform vec4 c4 : source_color = vec4(1.0, 0.54, 0.36, 1.0);
uniform vec4 glow_col : source_color = vec4(1.0, 0.42, 0.54, 1.0);

uniform vec2 view_size = vec2(1280.0, 720.0);
uniform float horizon = 0.82;
uniform float time = 0.0;
uniform float dot_step = 15.0;
uniform float dot_alpha = 0.05;
uniform float detail : hint_range(0.0, 1.0) = 1.0;

vec4 sky_at(float f) {
	float x = clamp(f, 0.0, 1.0) * 4.0;
	if (x < 1.0) return mix(c0, c1, x);
	if (x < 2.0) return mix(c1, c2, x - 1.0);
	if (x < 3.0) return mix(c2, c3, x - 2.0);
	return mix(c3, c4, x - 3.0);
}

void fragment() {
	vec2 px = UV * view_size;
	float f = px.y / max(view_size.y, 1.0);
	vec3 c = sky_at(f / max(horizon, 0.01)).rgb;

	// halftone: a printed dot screen, which also dithers the gradient's banding
	if (detail > 0.5) {
		vec2 g = px / dot_step;
		vec2 cell = fract(g) - 0.5;
		float d = length(cell);
		c += vec3(dot_alpha) * smoothstep(0.34, 0.0, d);

		// scanlines, drifting
		float sl = sin((px.y + time * 12.0) * 1.6);
		c *= 1.0 - 0.045 * step(0.0, sl);
	}

	// the horizon burns where the timeline starts
	float hg = smoothstep(0.18, 0.0, abs(f - horizon));
	c += glow_col.rgb * hg * 0.30;

	// a soft key light, top right: the only "sun" this world has
	vec2 sun_uv = vec2(0.82, 0.16);
	float sd = length((UV - sun_uv) * vec2(view_size.x / view_size.y, 1.0));
	c += glow_col.rgb * smoothstep(0.55, 0.0, sd) * 0.22;
	c += vec3(1.0, 0.95, 0.85) * smoothstep(0.16, 0.0, sd) * 0.10;

	// slow vertical light bands, like a screen photographed off-axis
	if (detail > 0.5) {
		float band = sin(UV.x * 9.0 + time * 0.12) * 0.5 + 0.5;
		c *= 1.0 + (band - 0.5) * 0.035;
	}

	// corners fall off so the middle of the feed stays legible
	vec2 v = UV - vec2(0.5, 0.5);
	float vig = smoothstep(0.35, 1.05, length(v) * 1.35);
	c *= 1.0 - vig * 0.45;

	COLOR = vec4(c, 1.0);
}
