import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Scissors, 
  Calendar, 
  Users, 
  LogOut,
  Menu,
  X,
  Ban,
  CalendarClock
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/services', label: 'Usługi', icon: Scissors },
  { path: '/admin/bookings', label: 'Rezerwacje', icon: Calendar },
  { path: '/admin/team', label: 'Zespół', icon: Users },
  { path: '/admin/schedule', label: 'Grafik', icon: CalendarClock },
  { path: '/admin/blacklist', label: 'Czarna lista', icon: Ban },
];

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/v1/admin/check', {
          credentials: 'include',
        });
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Błąd sprawdzania sesji:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  // Przekieruj na login jeśli niezalogowany
  if (isAuthenticated === false) {
    return <Navigate to="/admin/login" replace />;
  }

  // Pokaż loader podczas sprawdzania
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/admin/login');
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${
          isSidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {isSidebarOpen && (
            <span className="text-xl font-bold">SZYMON</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:bg-gray-800"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isSidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-gray-800">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={`w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white ${
              !isSidebarOpen && 'justify-center'
            }`}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isSidebarOpen && <span className="ml-3">Wyloguj</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
