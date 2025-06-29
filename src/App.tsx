import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';


const GameCanvas = dynamic(() => import('./GameCanvas'), { ssr: false });


function App()
{
    return <GameCanvas />;
}

export default App
