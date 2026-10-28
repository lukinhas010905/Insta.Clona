import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Fluxo from '@/flow/Fluxo'
import Success from '@/pages/Success'
import { ConfigProvider } from '@/lib/config'

// O site e uma experiencia de tela cheia: sem header, sem rodape.
// /obrigado existe para o gateway devolver o cliente apos o pagamento.
export default function App() {
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route index element={<Fluxo />} />
          <Route path="obrigado" element={<Success />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
