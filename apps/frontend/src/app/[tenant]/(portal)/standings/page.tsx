import type { Metadata } from 'next'
import { Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

// SSR — classification must always reflect the latest match results
export const dynamic = 'force-dynamic'

interface Props { params: Promise<{ tenant: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Tabela de Classificação',
    description: 'Classificação atualizada dos campeonatos. Pontos, vitórias, saldo de gols.',
    openGraph: { title: 'Tabela de Classificação' },
  }
}

const REGIONAL_STANDINGS = [
  { pos: 1, team: 'Rápidos FC', pts: 22, pj: 8, v: 7, e: 1, d: 0, gp: 24, gc: 8, sg: 16, form: ['V', 'V', 'V', 'V', 'V'] },
  { pos: 2, team: 'Estrela Azul', pts: 16, pj: 8, v: 5, e: 1, d: 2, gp: 18, gc: 12, sg: 6, form: ['V', 'E', 'V', 'D', 'V'] },
  { pos: 3, team: 'Tornado FC', pts: 13, pj: 8, v: 4, e: 1, d: 3, gp: 15, gc: 14, sg: 1, form: ['D', 'V', 'D', 'V', 'E'] },
  { pos: 4, team: 'Unidos SC', pts: 10, pj: 8, v: 3, e: 1, d: 4, gp: 12, gc: 16, sg: -4, form: ['D', 'V', 'D', 'D', 'V'] },
  { pos: 5, team: 'Leões do Norte', pts: 7, pj: 8, v: 2, e: 1, d: 5, gp: 10, gc: 18, sg: -8, form: ['D', 'D', 'E', 'D', 'V'] },
  { pos: 6, team: 'Guerreiros', pts: 4, pj: 8, v: 1, e: 1, d: 6, gp: 6, gc: 22, sg: -16, form: ['D', 'D', 'D', 'V', 'D'] },
]

const COPA_CIDADE_GROUPS = [
  {
    name: 'Grupo A',
    standings: [
      { pos: 1, team: 'Falcões EC', pts: 7, pj: 3, v: 2, e: 1, d: 0, gp: 5, gc: 2, sg: 3, form: ['V', 'E', 'V'] },
      { pos: 2, team: 'Sport Clube', pts: 4, pj: 3, v: 1, e: 1, d: 1, gp: 4, gc: 3, sg: 1, form: ['D', 'V', 'E'] },
      { pos: 3, team: 'Guerreiros', pts: 4, pj: 3, v: 1, e: 1, d: 1, gp: 3, gc: 4, sg: -1, form: ['V', 'E', 'D'] },
      { pos: 4, team: 'Santos Atlético', pts: 1, pj: 3, v: 0, e: 1, d: 2, gp: 2, gc: 5, sg: -3, form: ['D', 'E', 'D'] },
    ],
  },
  {
    name: 'Grupo B',
    standings: [
      { pos: 1, team: 'Estrela Azul', pts: 7, pj: 3, v: 2, e: 1, d: 0, gp: 6, gc: 3, sg: 3, form: ['V', 'V', 'E'] },
      { pos: 2, team: 'Leões do Norte', pts: 4, pj: 3, v: 1, e: 1, d: 1, gp: 4, gc: 4, sg: 0, form: ['E', 'D', 'V'] },
      { pos: 3, team: 'Tornado FC', pts: 3, pj: 3, v: 1, e: 0, d: 2, gp: 3, gc: 5, sg: -2, form: ['D', 'V', 'D'] },
      { pos: 4, team: 'Unidos SC', pts: 2, pj: 3, v: 0, e: 2, d: 1, gp: 2, gc: 3, sg: -1, form: ['E', 'D', 'E'] },
    ],
  },
]

const FORM_COLORS: Record<string, string> = {
  V: 'bg-emerald-500/20 text-emerald-400',
  E: 'bg-amber-500/20 text-amber-400',
  D: 'bg-red-500/20 text-red-400',
}

function StandingsTable({ rows, qualifiers = 2 }: { rows: typeof REGIONAL_STANDINGS; qualifiers?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-center">Pts</TableHead>
          <TableHead className="text-center">PJ</TableHead>
          <TableHead className="text-center">V</TableHead>
          <TableHead className="text-center">E</TableHead>
          <TableHead className="text-center">D</TableHead>
          <TableHead className="text-center">SG</TableHead>
          <TableHead className="hidden sm:table-cell">Forma</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.team} className={row.pos <= qualifiers ? 'bg-primary/3' : ''}>
            <TableCell>
              <span className={`inline-flex size-6 items-center justify-center rounded text-[11px] font-bold
                ${row.pos <= qualifiers ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                {row.pos}
              </span>
            </TableCell>
            <TableCell className="font-medium text-sm">{row.team}</TableCell>
            <TableCell className="text-center font-display font-bold">{row.pts}</TableCell>
            <TableCell className="text-center text-sm text-muted-foreground">{row.pj}</TableCell>
            <TableCell className="text-center text-sm text-emerald-400">{row.v}</TableCell>
            <TableCell className="text-center text-sm text-amber-400">{row.e}</TableCell>
            <TableCell className="text-center text-sm text-red-400">{row.d}</TableCell>
            <TableCell className={`text-center text-sm font-semibold ${row.sg > 0 ? 'text-emerald-400' : row.sg < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {row.sg > 0 ? '+' : ''}{row.sg}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <div className="flex gap-0.5">
                {row.form.map((f, i) => (
                  <span key={i} className={`inline-flex size-5 items-center justify-center rounded text-[9px] font-bold ${FORM_COLORS[f]}`}>
                    {f}
                  </span>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default async function StandingsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="size-7 text-primary" />
          Tabela de Classificação
        </h1>
        <p className="mt-2 text-muted-foreground">Classificação atualizada em tempo real após cada rodada.</p>
      </div>

      {/* Regional */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Regional 2024</CardTitle>
            <Badge variant="success">Quartas de Final</Badge>
          </div>
          <p className="text-xs text-muted-foreground">Os 2 primeiros avançam para a semifinal</p>
        </CardHeader>
        <CardContent className="p-0 pb-1">
          <StandingsTable rows={REGIONAL_STANDINGS} qualifiers={2} />
        </CardContent>
      </Card>

      {/* Copa Cidade — groups */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Copa Cidade</h2>
          <Badge variant="default">Fase de Grupos</Badge>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {COPA_CIDADE_GROUPS.map((group) => (
            <Card key={group.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 pb-1">
                <StandingsTable rows={group.standings} qualifiers={2} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary/20" />
          Classifica para próxima fase
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(FORM_COLORS).map(([k, v]) => (
            <span key={k} className={`inline-flex size-5 items-center justify-center rounded text-[9px] font-bold ${v}`}>{k}</span>
          ))}
          <span>Forma recente</span>
        </div>
      </div>
    </div>
  )
}
