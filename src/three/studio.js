import * as THREE from 'three'

/*
  Photo-studio reflections for polished metal.
  Real watch photos look like mirror steel because the metal reflects big
  white softboxes against a dark studio: sharp bright bands next to near
  black. This builds that studio as a tiny scene (dark room + glowing
  panels) that PMREM turns into the environment map.
*/
export function studioScene() {
  const scene = new THREE.Scene()
  const disposables = []
  const add = (geo, mat, setup) => {
    const m = new THREE.Mesh(geo, mat)
    setup(m)
    scene.add(m)
    disposables.push(geo, mat)
  }

  // dark room, slightly lighter floor so lower edges are not pure black
  add(new THREE.BoxGeometry(20, 20, 20), new THREE.MeshBasicMaterial({ color: '#0b0b0c', side: THREE.BackSide }), () => {})
  add(new THREE.PlaneGeometry(20, 20), new THREE.MeshBasicMaterial({ color: '#1a1a1b' }), (m) => {
    m.rotation.x = -Math.PI / 2
    m.position.y = -9.9
  })

  // a glowing panel; strength above 1 = brighter than white (HDR)
  const panel = (w, h, strength, tint, pos, look) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(tint).multiplyScalar(strength), side: THREE.DoubleSide })
    add(new THREE.PlaneGeometry(w, h), mat, (m) => {
      m.position.set(...pos)
      m.lookAt(...look)
    })
  }

  const O = [0, 0, 0]
  panel(12, 5, 7, '#ffffff', [0, 9.5, 1], O) // big overhead softbox
  panel(1.6, 12, 9, '#ffffff', [-8.5, 1, 3], O) // tall strip, left
  panel(1.2, 12, 6, '#ffffff', [8.5, 0.5, 2], O) // tall strip, right
  panel(10, 2.2, 2.2, '#ffffff', [0, -3, 9.5], O) // low front fill card
  panel(9, 4, 2.6, '#ffffff', [1.5, 4.5, 9.5], O) // big softbox above the camera: lights hands, indices and dial
  panel(3, 3, 4, '#fff1dc', [5, 6, -7], O) // warm kicker behind
  panel(6, 1.4, 3, '#ffffff', [-3, -6, -8], O) // under-back strip for the caseback

  return {
    scene,
    dispose() {
      disposables.forEach((d) => d.dispose())
    },
  }
}
