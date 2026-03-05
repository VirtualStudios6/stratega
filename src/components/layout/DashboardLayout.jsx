import Sidebar from "./Sidebar"
import AIAssistant from "../shared/AIAssistant"

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#080810]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 overflow-y-auto">
        {children}
      </main>
      <AIAssistant />
    </div>
  )
}

export default DashboardLayout
