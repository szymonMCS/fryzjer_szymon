import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Scissors, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalBookings: number;
  todayBookings: number;
  totalServices: number;
  totalTeamMembers: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    todayBookings: 0,
    totalServices: 0,
    totalTeamMembers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Pobierz rezerwacje
        const bookingsRes = await fetch('/api/v1/bookings/admin/bookings', {
          credentials: 'include',
        });
        const bookings = bookingsRes.ok ? await bookingsRes.json() : [];

        // Pobierz usługi
        const servicesRes = await fetch('/api/v1/services');
        const services = servicesRes.ok ? await servicesRes.json() : [];

        // Pobierz zespół
        const teamRes = await fetch('/api/v1/team');
        const team = teamRes.ok ? await teamRes.json() : [];

        // Oblicz dzisiejsze rezerwacje
        const today = new Date().toISOString().split('T')[0];
        const todayBookings = bookings.filter((b: any) => 
          b.booking_date === today
        ).length;

        setStats({
          totalBookings: bookings.length,
          todayBookings,
          totalServices: services.length,
          totalTeamMembers: team.length,
        });
      } catch (error) {
        console.error('Błąd pobierania statystyk:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Dzisiejsze rezerwacje',
      value: stats.todayBookings,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      title: 'Wszystkie rezerwacje',
      value: stats.totalBookings,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Usługi',
      value: stats.totalServices,
      icon: Scissors,
      color: 'bg-purple-500',
    },
    {
      title: 'Członkowie zespołu',
      value: stats.totalTeamMembers,
      icon: Users,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Przegląd aktywności salonu
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2 rounded-md ${card.color}`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
