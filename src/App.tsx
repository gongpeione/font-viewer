import { useState } from 'react';
import { FileUploader } from "react-drag-drop-files";
// @ts-ignore
import font from 'fonteditor-core/lib/ttf/font';
// import reactLogo from './assets/react.svg'
import './App.css';

const fileTypes = ["ttf"];
const defaultTab = {
  unicode: {
    text: 'cmap',
    active: true,
    link: 'https://docs.microsoft.com/en-us/typography/opentype/spec/cmap'
  }
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [ttf, setTTF] = useState(null);
  const [tab, setTab] = useState(defaultTab);

  const handleChange = async (file: File) => {
    const fontBuffer = await file.arrayBuffer();
    let ttf = font.create(fontBuffer, {
      type: 'ttf'
    });

    setFile(file);
    setTTF(ttf);

    console.log({ttf});
  };

  const { name: fontNameObj, glyf, cmap } = ttf?.data || {};

  return (
    <div className="App">
      {!ttf ? (
        <div className="upload-wrapper">
          <FileUploader classes="upload" handleChange={handleChange} name="file" types={fileTypes}>
            Drag and drop .ttf
          </FileUploader>
        </div>
      ) : ''}

      {ttf ? (
        <main>
          <div className="sidebar">
            <div className="sidebar-title">Font Info</div>
            <ul className='font-names'>
              {fontNameObj ? Object.keys(fontNameObj).map(name => {
                return <li>
                  <span className='font-names__label'>{name[0].toUpperCase()}{name.slice(1)}:</span>
                  <span>{fontNameObj[name]}</span>
                </li>
              }) : ''}
              <li>
                <span className='font-names__label'>Glyphs</span>
                <span>{glyf.length}</span>
              </li>
            </ul>
          </div>
          <div className="content">
            <ul className="tab">
              {Object.keys(tab).map((t: any) => <li className={tab[t].active ? 'active' : ''}>{tab[t].text.toUpperCase()}</li>)}
            </ul>

            <div className="content-wrapper">
              {tab['unicode'] ? (
                <ol className='unicode-list'>
                  {Object.keys(cmap).map(c => (
                    <li>
                      <div className="unicode-cover">
                        <span>code: {c}</span>
                        <span>target: {cmap[c]}</span>
                        <span>{String.fromCharCode(c as Number)}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ): ''}
            </div>
          </div>
        </main>
      ) : ''}
    </div>
  )
}

export default App
