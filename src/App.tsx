import { useEffect, useRef, useState } from 'react';
import './App.scss';

// COMPONENTS
import Canvas from './components/Canvas';
import Menu from './components/Menu';

// CLASSES
import { mouseHandler } from './Handlers/mouseHandler';
import { canvasHandler } from './Handlers/canvasHandler';

function App() {
  const canvasRef = useRef(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isGeneratiing, setIsGenerating] = useState(false)
  const [mouse, setMouse] = useState(null as mouseHandler | null)
  const [canvas, setCanvas] = useState(null as canvasHandler | null)
  
  useEffect(() => {
    if (!canvasRef.current) return

    const canvasElm: HTMLCanvasElement = canvasRef.current
    const canvasState = new canvasHandler(
        canvasElm, 
        {value: isSearching, set: setIsSearching}, 
        {value: isGeneratiing, set: setIsGenerating}
      )
    const mouseState = new mouseHandler(canvasState)
    
    window.addEventListener("mouseup", (e) => {
      mouseState.up(e)
    })
    window.addEventListener("mousemove", (e) => {
      mouseState.move(e)
    })

    window.addEventListener("resize", (e) => {
      canvasState.init()
    })

    setCanvas(canvasState)
    setMouse(mouseState)
  },[canvasRef])

  return (
    <div className="App">
      <Menu 
        canvas={canvas} 
        mouse={mouse} 
        isSearching={isSearching} 
        isGenerating={isGeneratiing} 
      />
      <Canvas ref={canvasRef} mouse={mouse} />
    </div>
  );
}

export default App;
