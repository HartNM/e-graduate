import{t as l,j as e,M as m,C as x,T as h}from"./index-B7_hvkM2.js";/* empty css                    */import{c as n}from"./createReactComponent-DJN_V7q0.js";/**
 * @license @tabler/icons-react v3.34.1 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",key:"svg-0"}],["path",{d:"M9 12l2 2l4 -4",key:"svg-1"}]],d=n("outline","circle-check","CircleCheck",u);/**
 * @license @tabler/icons-react v3.34.1 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",key:"svg-0"}],["path",{d:"M10 10l4 4m0 -4l-4 4",key:"svg-1"}]],f=n("outline","circle-x","CircleX",p),k=({opened:t,onClose:c,message:o,type:r="success",timeout:s=3e3})=>{l.useEffect(()=>{if(t){const a=setTimeout(()=>{c()},s);return()=>clearTimeout(a)}},[t,s,c]);const i=r==="success"?e.jsx(d,{size:256,color:"green",className:"icon-bounce"}):e.jsx(f,{size:256,color:"red",className:"icon-shake"});return e.jsx(m,{opened:t,onClose:c,withCloseButton:!1,centered:!0,size:"auto",zIndex:9999,styles:{content:{width:"400px",height:"400px",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center"}},children:e.jsxs(x,{style:{flexDirection:"column",gap:"1rem"},children:[i,e.jsx(h,{size:"xl",fw:600,children:o})]})})};export{k as M};
