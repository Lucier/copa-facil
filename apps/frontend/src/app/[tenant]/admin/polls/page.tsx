'use client'
import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Send, Lock, BarChart2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import api from '@/services/api'
import { API } from '@/services/endpoints'

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const STATUS_CONFIG: Record<string, { label: string; variant: 'outline' | 'success' | 'destructive' | 'default' }> = {
  draft:  { label: 'Rascunho', variant: 'outline' },
  active: { label: 'Ativa',    variant: 'success' },
  closed: { label: 'Fechada',  variant: 'destructive' },
}

interface Championship { id: string; name: string; season: string }
interface Poll { id: string; championshipId: string; question: string; status: string; createdAt: string }
interface PollResults {
  id: string; question: string; status: string; totalVotes: number; userVotedOptionId: string | null
  options: { id: string; text: string; votesCount: number; percentage: number }[]
}

function CreatePollDialog({ championshipId, onSuccess }: { championshipId: string; onSuccess: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [question, setQuestion] = React.useState('')
  const [options, setOptions] = React.useState(['', ''])

  function addOption() { if (options.length < 10) setOptions((o) => [...o, '']) }
  function setOption(i: number, val: string) {
    setOptions((prev) => { const next = [...prev]; next[i] = val; return next })
  }
  function removeOption(i: number) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }

  const mutation = useMutation({
    mutationFn: () => api.post(API.polls.create(championshipId), {
      question: question.trim(),
      options: options.map((o) => o.trim()).filter(Boolean),
    }),
    onSuccess: () => { setOpen(false); setQuestion(''); setOptions(['', '']); onSuccess() },
  })

  const valid = question.trim() && options.filter((o) => o.trim()).length >= 2

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2"><Plus className="size-4" />Nova Enquete</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Criar Enquete</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>Pergunta</Label>
            <Input className="mt-1" value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex: Qual time vai ser campeão?" />
          </div>
          <div className="space-y-2">
            <Label>Opções</Label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input value={opt} onChange={(e) => setOption(i, e.target.value)} placeholder={`Opção ${i + 1}`} />
                {options.length > 2 && (
                  <Button type="button" size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeOption(i)}>
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <Button type="button" variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={addOption}>
                <Plus className="size-3" /> Adicionar opção
              </Button>
            )}
          </div>
          <Button className="w-full" disabled={!valid || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Salvando...' : 'Criar Enquete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PollResultsSheet({ poll, championshipId }: { poll: Poll; championshipId: string }) {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()

  const { data: results } = useQuery<PollResults>({
    queryKey: ['poll-results', poll.id],
    queryFn: async () => {
      const { data } = await api.get(API.polls.results(championshipId, poll.id))
      return data
    },
    enabled: open,
  })

  const publish = useMutation({
    mutationFn: () => api.post(API.polls.publish(championshipId, poll.id), {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls', championshipId] }),
  })
  const close = useMutation({
    mutationFn: () => api.post(API.polls.close(championshipId, poll.id), {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls', championshipId] }),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="gap-1.5">
          <BarChart2 className="size-3.5" />Resultados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">{poll.question}</DialogTitle>
        </DialogHeader>
        {results ? (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">{results.totalVotes} voto(s)</p>
            <div className="space-y-3">
              {results.options.map((opt) => (
                <div key={opt.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={opt.id === results.userVotedOptionId ? 'font-semibold text-primary' : ''}>{opt.text}</span>
                    <span className="text-muted-foreground">{opt.percentage.toFixed(1)}% ({opt.votesCount})</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${opt.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {poll.status === 'draft' && (
                <Button size="sm" className="gap-2" onClick={() => publish.mutate()} disabled={publish.isPending}>
                  <Send className="size-3.5" />Publicar
                </Button>
              )}
              {poll.status === 'active' && (
                <Button size="sm" variant="outline" className="gap-2" onClick={() => close.mutate()} disabled={close.isPending}>
                  <Lock className="size-3.5" />Fechar
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">Carregando...</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function PollsPage() {
  const queryClient = useQueryClient()
  const [selectedChampId, setSelectedChampId] = React.useState<string>('')

  const { data: championships = [] } = useQuery<Championship[]>({
    queryKey: ['championships'],
    queryFn: async () => { const { data } = await api.get(API.championships.base); return data },
  })

  const { data: polls = [], isLoading } = useQuery<Poll[]>({
    queryKey: ['polls', selectedChampId],
    queryFn: async () => {
      const { data } = await api.get(API.polls.list(selectedChampId))
      return data
    },
    enabled: Boolean(selectedChampId),
  })

  const activeCount = polls.filter((p) => p.status === 'active').length
  const draftCount = polls.filter((p) => p.status === 'draft').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Enquetes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Crie e gerencie enquetes para os torcedores participarem.</p>
        </div>
        {selectedChampId && (
          <CreatePollDialog championshipId={selectedChampId}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['polls', selectedChampId] })} />
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Campeonato:</label>
        <select value={selectedChampId} onChange={(e) => setSelectedChampId(e.target.value)} className={SELECT_CLASS}>
          <option value="">Selecione um campeonato</option>
          {championships.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.season})</option>
          ))}
        </select>
      </div>

      {selectedChampId && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Total de Enquetes', value: polls.length },
            { label: 'Enquetes Ativas', value: activeCount },
            { label: 'Rascunhos', value: draftCount },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedChampId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Enquetes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Carregando...</p>}
            {!isLoading && polls.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nenhuma enquete criada. Crie a primeira para engajar os torcedores!
              </p>
            )}
            {!isLoading && polls.length > 0 && (
              <div className="divide-y divide-border">
                {polls.map((poll) => {
                  const st = STATUS_CONFIG[poll.status] ?? STATUS_CONFIG.draft
                  return (
                    <div key={poll.id} className="flex items-center justify-between px-6 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{poll.question}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(poll.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <PollResultsSheet poll={poll} championshipId={selectedChampId} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!selectedChampId && (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Selecione um campeonato para gerenciar as enquetes.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
