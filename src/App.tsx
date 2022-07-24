import { FormEvent, FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import { FileUploader } from "react-drag-drop-files";
// @ts-ignore
import font from 'fonteditor-core/lib/ttf/font';
// import reactLogo from './assets/react.svg'
import './App.css';
import range from './font-range.json';
// import r from './r.ttf';

const fileTypes = ['ttf', 'otf'];
const defaultTab = {
  cmap: {
    text: 'cmap',
    active: true,
    link: 'https://docs.microsoft.com/en-us/typography/opentype/spec/cmap',
    description: 'This table defines the mapping of character codes to the glyph index values used in the font. It may contain more than one subtable, in order to support more than one character encoding scheme.'
  },
  os2: {
    text: 'os/2',
    active: false,
    link: 'https://docs.microsoft.com/en-us/typography/opentype/spec/os2',
    description: 'The OS/2 table consists of a set of metrics and other data that are required in OpenType fonts.'
  },
  head: {
    text: 'head',
    active: false,
    link: 'https://docs.microsoft.com/en-us/typography/opentype/spec/head',
    description: 'This table gives global information about the font. The bounding box values should be computed using only glyphs that have contours. Glyphs with no contours should be ignored for the purposes of these calculations.'
  },
  hhea: {
    text: 'hhea',
    active: false,
    link: 'https://docs.microsoft.com/en-us/typography/opentype/spec/hhea',
    description: 'This table contains information for horizontal layout. The values in the minRightSidebearing, minLeftSideBearing and xMaxExtent should be computed using only glyphs that have contours. Glyphs with no contours should be ignored for the purposes of these calculations. All reserved areas must be set to 0.'
  },
  subset: {
    text: 'Subset',
    active: false,
    description: 'Font subset based on Google font unicode range',
    link: ''
  },
  glyph: {
    text: 'Glyph',
    active: false,
    description: 'This table contains information that describes the glyphs in the font in the TrueType outline format. Information regarding the rasterizer (scaler) refers to the TrueType rasterizer. ',
    link: 'https://docs.microsoft.com/en-us/typography/opentype/spec/glyf'
  }
};

interface IGlyph {
  advanceWidth: number,
  contours: Array<Array<{
    onCurve: boolean
    x: number
    y: number
  }>>,
  leftSideBearing: number,
  name: string,
  xMax: number,
  xMin: number,
  yMax: number,
  yMin: number,
};

type TTab = keyof typeof defaultTab;
type TGlyphKey = keyof IGlyph;

const icons = {
  doc: '<svg t="1658586064814" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3065" width="200" height="200"><path d="M664.132267 0H110.933333v1024h802.133334V248.9344L664.132267 0z m10.001066 58.2656L854.801067 238.933333H674.133333V58.2656zM145.066667 989.866667V34.133333h494.933333v238.933334h238.933333v716.8h-733.866666z" fill="" p-id="3066"></path><path d="M281.6 290.133333h153.6a17.066667 17.066667 0 1 0 0-34.133333h-153.6a17.066667 17.066667 0 1 0 0 34.133333zM571.733333 631.466667h-290.133333a17.066667 17.066667 0 1 0 0 34.133333h290.133333a17.066667 17.066667 0 1 0 0-34.133333zM742.4 512h-119.466667a17.066667 17.066667 0 1 0 0 34.133333h119.466667a17.066667 17.066667 0 1 0 0-34.133333zM281.6 426.666667h85.333333a17.066667 17.066667 0 1 0 0-34.133334h-85.333333a17.066667 17.066667 0 1 0 0 34.133334zM537.6 426.666667h119.466667a17.066667 17.066667 0 1 0 0-34.133334h-119.466667a17.066667 17.066667 0 1 0 0 34.133334zM435.2 409.6c0 4.437333 1.877333 8.874667 4.949333 12.117333 3.242667 3.072 7.68 4.949333 12.117334 4.949334 4.437333 0 8.874667-1.877333 12.117333-4.949334 3.072-3.242667 4.949333-7.68 4.949333-12.117333 0-4.4544-1.877333-8.891733-4.949333-12.117333-6.314667-6.314667-17.749333-6.314667-24.234667 0-3.072 3.2256-4.949333 7.662933-4.949333 12.117333zM366.933333 512a17.066667 17.066667 0 1 0 0 34.133333h170.666667a17.066667 17.066667 0 1 0 0-34.133333h-170.666667zM281.6 546.133333c4.437333 0 8.874667-1.877333 12.117333-4.949333 3.072-3.242667 4.949333-7.68 4.949334-12.117333 0-4.4544-1.877333-8.891733-4.949334-12.117334-6.314667-6.314667-17.92-6.314667-24.234666 0-3.072 3.2256-4.949333 7.492267-4.949334 12.117334 0 4.437333 1.877333 8.874667 4.949334 12.117333 3.242667 3.072 7.68 4.949333 12.117333 4.949333zM742.4 750.933333h-119.466667a17.066667 17.066667 0 1 0 0 34.133334h119.466667a17.066667 17.066667 0 1 0 0-34.133334zM537.6 750.933333h-170.666667a17.066667 17.066667 0 1 0 0 34.133334h170.666667a17.066667 17.066667 0 1 0 0-34.133334zM269.482667 755.882667a17.288533 17.288533 0 0 0 0 24.234666c3.242667 3.072 7.68 4.949333 12.117333 4.949334 4.608 0 8.874667-1.877333 12.117333-4.949334 3.072-3.242667 4.949333-7.68 4.949334-12.117333a16.8448 16.8448 0 0 0-4.949334-11.946667c-6.314667-6.485333-17.749333-6.485333-24.234666-0.170666zM730.282667 397.482667c-3.072 3.2256-4.949333 7.662933-4.949334 12.117333 0 4.437333 1.877333 8.874667 4.949334 12.117333 3.242667 3.072 7.68 4.949333 12.117333 4.949334 4.437333 0 8.874667-1.877333 12.117333-4.949334 3.242667-3.242667 4.949333-7.68 4.949334-12.117333 0-4.4544-1.706667-8.891733-4.949334-12.117333-6.485333-6.314667-17.749333-6.314667-24.234666 0zM669.184 660.650667c3.072-3.242667 4.949333-7.68 4.949333-12.117334 0-4.4544-1.877333-8.891733-4.949333-12.117333-6.485333-6.314667-17.92-6.314667-24.234667 0-3.072 3.2256-4.949333 7.662933-4.949333 12.117333 0 4.437333 1.877333 8.874667 4.949333 12.117334 3.242667 3.2256 7.509333 4.949333 12.117334 4.949333s8.874667-1.877333 12.117333-4.949333zM730.282667 636.416c-3.072 3.2256-4.949333 7.662933-4.949334 12.117333 0 4.437333 1.877333 8.874667 4.949334 12.117334 3.242667 3.072 7.509333 4.949333 12.117333 4.949333s8.874667-1.877333 12.117333-4.949333c3.072-3.242667 4.949333-7.68 4.949334-12.117334 0-4.4544-1.877333-8.891733-4.949334-12.117333-6.314667-6.314667-17.92-6.314667-24.234666 0z" fill="" p-id="3067"></path></svg>'
};

const pixelRatio = window.devicePixelRatio || 1;

function App() {
  // const [file, setFile] = useState<File | null>(null);
  const [ttf, setTTF] = useState<any>(null);
  const [tab, setTab] = useState(defaultTab);
  const [cmapPerPage, setCmapPerPage] = useState(50);
  const [cmapPage, setCmapPage] = useState(0);
  const [searchCMAP, setSearchCMAP] = useState<string | number>('');

  const [rangePerPage, setRangePerPage] = useState(10);
  const [rangePage, setRangePage] = useState(0);

  const [curGlyph, setCurGlyph] = useState<IGlyph | null>(null);

  const handleChange = async (file: File) => {
    const fontBuffer = await file.arrayBuffer();
    const url = URL.createObjectURL(file);
    const suffix = (() => {
      const tmp = file.name.split('.');
      return tmp[tmp.length - 1];
    })();
    let ttf = font.create(fontBuffer, {
      type: suffix || 'ttf'
    });

    // setFile(file);
    setTTF(ttf);

    const css = `
      @font-face {
        font-family: "${ttf.data.name.fontFamily}";
        src: url(${url}) format("truetype");
        font-weight: normal;
        font-style: normal;
      }
    `;
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);

    console.log(css, {ttf});
  };

  const { name: fontNameObj, glyf, cmap, head, hhea } = ttf?.data || {};
  const os2 = ttf?.data['OS/2'];

  const openWindow = (link = '', e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    window.open(link);
    e.stopPropagation();
  }

  const switchTab = (tabKey: string) => {
    Object.keys(tab).forEach((t) => {
      if (t === tabKey) {
        tab[t as TTab].active = true;
      } else {
        tab[t as TTab].active = false;
      }
    });

    setTab({
      ...tab
    });
  }

  const onSearchCMAP = (e: FormEvent<HTMLInputElement>) => {
    const val = (e.target as any).value;

    if (/\d+/.test(val)) {
      setSearchCMAP(+val);
    } else {
      setSearchCMAP(val);
    }
  }

  const cmapListToShow = useMemo(() => {
    return Object.keys(cmap || {}).filter(c => {
      if (!searchCMAP) return true;
      if (typeof searchCMAP === 'number') {
        return +c === searchCMAP || +cmap[c] === searchCMAP;
      } else {
        return searchCMAP.includes(String.fromCharCode(+c));
      }
    })
  }, [cmap, searchCMAP]);

  const subsetRangeToShow = useMemo(() => {
    return range.filter(c => {
      return true;
      // if (!searchCMAP) return true;
      // if (typeof searchCMAP === 'number') {
      //   return +c === searchCMAP || +cmap[c] === searchCMAP;
      // } else {
      //   return searchCMAP.includes(String.fromCharCode(+c));
      // }
    })
  }, [cmap, searchCMAP]);

  useEffect(() => {
    const glyphBgCanvas = document.querySelector('.glyph-canvas-el') as HTMLCanvasElement;
    if (!glyphBgCanvas) {
      return;
    }
    const margin = 50;
    const w = glyphBgCanvas.width;
    const h = glyphBgCanvas.height;
    const glyphW = w - margin * 2;
    const glyphH = h - margin * 2;
    // const head = font.tables.head;
    const maxHeight = head.yMax - head.yMin;
    const ctx = glyphBgCanvas.getContext('2d');

    const glyphScale = Math.min(glyphW / (head.xMax - head.xMin), glyphH/maxHeight);
    const glyphSize = glyphScale * font.unitsPerEm;
    const glyphBaseline = margin + glyphH * head.yMax / maxHeight;

    function hline(text: string, yunits: number) {
      const ypx = glyphBaseline - yunits * glyphScale;
      ctx!.font = '16px sans-serif';
      ctx!.fillStyle = '#000';
      ctx!.fillText(text, 2, ypx + 5);
      ctx!.fillStyle = '#f00';
      ctx!.fillRect(130, ypx, w, 1);
    }

    ctx!.clearRect(0, 0, w, h);
    ctx!.fillStyle = '#000';

    hline('Baseline', 0);
    hline('yMax', head.yMax);
    hline('yMin', head.yMin);
    hline('Ascender', hhea.ascender);
    hline('Descender', hhea.descender);
    hline('TypoAscender', os2.sTypoAscender);
    hline('TypoDescender', os2.sTypoDescender);
  }, [curGlyph, head, hhea, os2]);

  // useEffect(() => {
  //   const css = `
  //     @font-face {
  //       font-family: "PH";
  //       src: url(${r}) format("truetype");
  //       font-weight: normal;
  //       font-style: normal;
  //     }
  //   `;
  //   const style = document.createElement('style');
  //   style.innerHTML = css;
  //   document.head.appendChild(style);
  // }, []);

  useEffect(() => {
    setCmapPage(0);
  }, [searchCMAP]);

  const createPagination = useCallback((list = [] as unknown[], curPage = 0, perPage = 20, setPage: React.Dispatch<React.SetStateAction<number>>) => {
    return list.length > perPage ? <ol className="pagination">
      <li onClick={() => setPage(0)}>First Page</li>
      <li onClick={() => curPage > 0 && setPage(curPage - 1)}>Prev</li>
      <li className='curpage'>{curPage + 1}/{Math.floor(list.length / perPage) + 1}</li>
      <li onClick={() => curPage < Math.floor(list.length / perPage) && setPage(curPage + 1)}>Next</li>
      <li onClick={() => setPage(Math.floor(list.length / perPage))}>Last Page</li>
    </ol> : ''
  }, []);

  const createRangeList = (unicodeRange: string) => {
    const range = /U\+(\w+)(\-(\w+))?/.exec(unicodeRange);
    if (!range) {
      return '';
    }

    const start = +`0x${range[1]}`;
    const end = range[3] ? +`0x${range[3]}` : start;

    return Array.from({ length: end - start + 1 }, (_, index) => {
      const code = start + index;
      return <span>{String.fromCharCode(code)}</span>;
    });
  }

  return (
    <div className="App">
      {!ttf ? (
        <div className="upload-wrapper">
          <FileUploader classes="upload" handleChange={handleChange} name="file" types={fileTypes}>
            Drag and drop font file (.ttf/.otf)
          </FileUploader>
        </div>
      ) : ''}

      {ttf ? (
        <main>
          <div className="sidebar">
            <div className="sidebar-title">Names</div>
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
              {Object.keys(tab).map((t: any) => (
                <li className={tab[t as TTab].active ? 'active' : ''} onClick={() => switchTab(t)} data-description={tab[t as TTab].description}>
                  <span>{tab[t as TTab].text.toUpperCase()}</span>
                  {tab[t as TTab].link ? <i className='tab-icon' onClick={(e) => openWindow(tab[t as TTab].link, e)} dangerouslySetInnerHTML={{ __html: icons.doc }}></i> : ''}
                </li>
              ))}
            </ul>

            <div className="content-wrapper">
              {tab.cmap.active ? (
                <>
                  <div className="unicode-search">
                    <input type="text" placeholder='Search Code' onInput={onSearchCMAP} />
                  </div>
                  {/* {JSON.stringify(curGlyph)} */}
                  <ol className='unicode-list'>
                    {cmapListToShow.slice(cmapPage * cmapPerPage, (cmapPage + 1) * cmapPerPage).map(c => (
                      <li onClick={() => {
                        setCurGlyph(glyf[cmap[c]]);
                        switchTab('glyph');
                      }}>
                        <div className="unicode-cover">
                          <span>code: {c}</span>
                          <span>glyph: {cmap[c]}</span>
                          <span style={{ fontFamily: `'${fontNameObj.fontFamily}'` }}>{String.fromCharCode(+c)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {createPagination(cmapListToShow, cmapPage, cmapPerPage, setCmapPage)}
                </>
              ): ''}

              {tab.os2.active ? (
                <ol className='os2-list'>
                  {Object.keys(os2).map(c => (
                    <li>
                      <div className="os2-cover">
                        <span>{c}</span>
                        <span>{os2[c]}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ): ''}

              {tab.head.active ? (
                <ol className='os2-list'>
                  {Object.keys(head).map(c => (
                    <li>
                      <div className="os2-cover">
                        <span>{c}</span>
                        <span>{head[c].getTime ? head[c].getTime() : head[c]}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ): ''}

              {tab.hhea.active ? (
                <ol className='os2-list'>
                  {Object.keys(hhea).map(c => (
                    <li>
                      <div className="os2-cover">
                        <span>{c}</span>
                        <span>{hhea[c].toString()}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ): ''}

              {tab.subset.active ? (
                <>
                  <ol className='subset-list'>
                    {subsetRangeToShow.slice(rangePage * rangePerPage, (rangePage + 1) * rangePerPage).map((r, index) => (
                      <li>
                        <div className="subset-title">
                          <div className="subset-index">{index + rangePage * rangePerPage}</div>
                          <div className='subset-range'>
                            {r.map(d => {
                              return (
                                <div className="subset">
                                  <span className='subset-code'>{d.toUpperCase()}</span>
                                  <span style={{ fontFamily: `'${fontNameObj.fontFamily}'` }}>{createRangeList(d)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {createPagination(subsetRangeToShow, rangePage, rangePerPage, setRangePage)}
                </>
              ): ''}

              {tab.glyph.active && curGlyph ? (
                <div className='glyph-info'>
                    <ul className="glyph-sidebar">
                      {Object.keys(curGlyph).filter(k => k !== 'contours').map(k => {
                        return <li><span className='glyph-sidebar-title'>{k}:</span>{curGlyph[k as TGlyphKey]}</li>
                      })}
                    </ul>
                    <div className="glyph-canvas">
                      <canvas height={1000} width={1000} className="glyph-canvas-el"></canvas>
                    </div>
                </div>
              ): ''}
            </div>
          </div>
        </main>
      ) : ''}
    </div>
  )
}

export default App
