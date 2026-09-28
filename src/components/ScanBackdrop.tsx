import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Lightweight ambient particle field + scanning plane, shown behind the OCR
 * processing screen. Purely decorative — cleans itself up fully on unmount.
 */
export default function ScanBackdrop() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const width = mount.clientWidth
    const height = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100)
    camera.position.set(0, 0, 6)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    mount.appendChild(renderer.domElement)

    // Particle field
    const count = 140
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: new THREE.Color('#d4a527'),
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    // Scanning plane (a soft horizontal bar that sweeps up/down, like a scanner)
    const scanGeo = new THREE.PlaneGeometry(6, 0.06)
    const scanMat = new THREE.MeshBasicMaterial({ color: '#e8c158', transparent: true, opacity: 0.35 })
    const scanPlane = new THREE.Mesh(scanGeo, scanMat)
    scene.add(scanPlane)

    let raf = 0
    const clock = new THREE.Clock()

    function animate() {
      const t = clock.getElapsedTime()
      points.rotation.y = t * 0.05
      points.rotation.x = Math.sin(t * 0.1) * 0.1
      scanPlane.position.y = Math.sin(t * 0.8) * 2.2
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }

    if (reduceMotion) {
      renderer.render(scene, camera)
    } else {
      animate()
    }

    function handleResize() {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      geometry.dispose()
      material.dispose()
      scanGeo.dispose()
      scanMat.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 -z-10" aria-hidden="true" />
}
