
export default function RootLayout(props:{children:any}){
  return<html>
    <body>
      {props.children}
    </body>
  </html>
}