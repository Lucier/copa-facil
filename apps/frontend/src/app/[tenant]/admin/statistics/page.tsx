import { BarChart3, Target, Trophy, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const STANDINGS = [
  { pos: 1, team: 'Rápidos FC', pts: 22, pj: 8, v: 7, e: 1, d: 0, gp: 24, gc: 8, sg: 16 },
  { pos: 2, team: 'Estrela Azul', pts: 16, pj: 8, v: 5, e: 1, d: 2, gp: 18, gc: 12, sg: 6 },
  { pos: 3, team: 'Tornado FC', pts: 13, pj: 8, v: 4, e: 1, d: 3, gp: 15, gc: 14, sg: 1 },
  { pos: 4, team: 'Unidos SC', pts: 10, pj: 8, v: 3, e: 1, d: 4, gp: 12, gc: 16, sg: -4 },
  { pos: 5, team: 'Leões do Norte', pts: 7, pj: 8, v: 2, e: 1, d: 5, gp: 10, gc: 18, sg: -8 },
  { pos: 6, team: 'Guerreiros', pts: 4, pj: 8, v: 1, e: 1, d: 6, gp: 6, gc: 22, sg: -16 },
]

const TOP_SCORERS = [
  { pos: 1, name: 'Carlos Mendes', team: 'Rápidos FC', goals: 12, assists: 5 },
  { pos: 2, name: 'Fernando Alves', team: 'Leões do Norte', goals: 9, assists: 3 },
  { pos: 3, name: 'Rafael Costa', team: 'Unidos SC', goals: 7, assists: 11 },
  { pos: 4, name: 'Pedro Rocha', team: 'Estrela Azul', goals: 6, assists: 4 },
  { pos: 5, name: 'Matheus Rocha', team: 'Tornado FC', goals: 4, assists: 8 },
]

export default function StatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Estatísticas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Classificação geral e ranking de artilharia.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Gols Marcados', value: '85', icon: Target },
          { label: 'Média por Jogo', value: '3.5', icon: BarChart3 },
          { label: 'Cartões Amarelos', value: '41', icon: Shield },
          { label: 'Lider da Tabela', value: 'Rápidos FC', icon: Trophy },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <s.icon className="size-7 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-display text-xl font-bold truncate">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Standings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Classificação — Regional 2024
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Pts</TableHead>
                  <TableHead>PJ</TableHead>
                  <TableHead>V</TableHead>
                  <TableHead>E</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>SG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STANDINGS.map((row) => (
                  <TableRow key={row.pos}>
                    <TableCell>
                      <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold
                        ${row.pos <= 2 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                        {row.pos}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{row.team}</TableCell>
                    <TableCell className="font-display font-bold text-sm">{row.pts}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.pj}</TableCell>
                    <TableCell className="text-xs text-emerald-400">{row.v}</TableCell>
                    <TableCell className="text-xs text-amber-400">{row.e}</TableCell>
                    <TableCell className="text-xs text-red-400">{row.d}</TableCell>
                    <TableCell className={`text-xs font-semibold ${row.sg > 0 ? 'text-emerald-400' : row.sg < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                      {row.sg > 0 ? '+' : ''}{row.sg}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Scorers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Artilharia
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Gols</TableHead>
                  <TableHead>Assist.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TOP_SCORERS.map((row) => (
                  <TableRow key={row.pos}>
                    <TableCell>
                      <span className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold
                        ${row.pos === 1 ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                        {row.pos}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{row.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.team}</TableCell>
                    <TableCell>
                      <Badge variant={row.pos === 1 ? 'default' : 'outline'} className="font-display font-bold">
                        {row.goals}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.assists}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
