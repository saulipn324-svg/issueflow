import type { Metadata } from 'next';
import './globals.css';
const title = 'Issueflow | Gestor de incidencias';
const description = 'Organiza incidencias, prioriza el trabajo y sigue cada solución. Demo de React y TypeScript con backend Java y Spring Boot disponible en el proyecto.';
export const metadata: Metadata = {
  metadataBase: new URL('https://issueflow-saul.saulipn324.chatgpt.site'), title, description,
  icons: {icon:'/favicon.svg'},
  openGraph: {title,description,type:'website',locale:'es_MX',images:[{url:'/og.png',width:1536,height:1024,alt:'Issueflow. Menos ruido. Más soluciones.'}]},
  twitter: {card:'summary_large_image',title,description,images:['/og.png']}
};
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="es"><body>{children}</body></html>;}
