// Turns the town into a round disc that fades to white at its rim, at every zoom level.
// It patches three.js's shared shader chunks once, before any material compiles, so every surface
// (buildings, roads, edge lines, pins, lights, clouds and the shadow and occlusion passes) obeys it.
import * as THREE from 'three';

export const DISC_INNER = 520, DISC_OUTER = 790; // metres from the centre: full colour inside, white beyond

const C = THREE.ShaderChunk;
// Declared next to the clipping code, because every shader that clips includes these two (not all include 'common').
C.clipping_planes_pars_vertex += '\nvarying vec2 vDiscXZ;\n';
C.clipping_planes_pars_fragment += '\nvarying vec2 vDiscXZ;\n';
// Every built in vertex shader, and the thick line shader, includes this chunk after mvPosition exists.
C.clipping_planes_vertex += '\nvDiscXZ = ( inverse( viewMatrix ) * vec4( mvPosition.xyz, 1.0 ) ).xz;\n';
// Included by every fragment shader, including depth, normal and shadow ones: cut everything past the rim.
C.clipping_planes_fragment += `\nif ( length( vDiscXZ ) > ${DISC_OUTER.toFixed(1)} ) discard;\n`;
// Colour shaders: blend towards white across the outer band.
C.fog_fragment += `\ngl_FragColor.rgb = mix( gl_FragColor.rgb, vec3( 1.0 ), smoothstep( ${DISC_INNER.toFixed(1)}, ${DISC_OUTER.toFixed(1)}, length( vDiscXZ ) ) );\n`;
