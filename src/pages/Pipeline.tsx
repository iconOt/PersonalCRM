import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { api } from '../api/client';
import { DEAL_STAGES, DEAL_STAGE_LABELS } from '../types';
import { ErrorState, InlineError, LoadingState } from '../components/States';

interface DealsByStage {
  [key: string]: any[];
}

export default function Pipeline() {
  const [dealsByStage, setDealsByStage] = useState<DealsByStage>({});
  const [error, setError] = useState<unknown>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const allDeals = await api.deals.list();
      const grouped: DealsByStage = {};
      DEAL_STAGES.forEach((s) => { grouped[s] = []; });
      allDeals.forEach((d: any) => {
        if (grouped[d.stage]) {
          grouped[d.stage].push(d);
        }
      });
      setDealsByStage(grouped);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const newStage = destination.droppableId;
    const dealId = draggableId;

    setDealsByStage((prev) => {
      const updated = { ...prev };
      const sourceList = [...(updated[source.droppableId] || [])];
      const destList = source.droppableId === destination.droppableId ? sourceList : [...(updated[destination.droppableId] || [])];
      const [moved] = sourceList.splice(source.index, 1);
      // Keep the local copy's own stage in step with the move, otherwise the board
      // disagrees with the database until the next reload.
      destList.splice(destination.index, 0, { ...moved, stage: newStage });
      updated[source.droppableId] = sourceList;
      updated[destination.droppableId] = destList;
      return updated;
    });

    setError(null);
    try {
      await api.deals.update(dealId, { stage: newStage });
    } catch (e) {
      // The stage change did not save — put the deal back where the database still has it.
      setError(e);
      await load();
    }
  };

  if (!loaded) return <LoadingState />;
  if (error && Object.keys(dealsByStage).length === 0) {
    return <ErrorState error={error} onRetry={load} title="Could not load the pipeline" />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Pipeline</h1>
      {error != null && <div className="mb-4"><InlineError error={error} /></div>}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEAL_STAGES.map((stage) => (
            <div key={stage} className="min-w-[280px] flex-shrink-0">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-t-xl px-4 py-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{DEAL_STAGE_LABELS[stage]}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {dealsByStage[stage]?.length || 0}
                </span>
              </div>
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-b-xl p-2 space-y-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    {(dealsByStage[stage] || []).map((deal, index) => (
                      <Draggable key={deal.id} draggableId={String(deal.id)} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 shadow-sm cursor-grab transition-shadow ${
                              snapshot.isDragging ? 'shadow-md' : ''
                            }`}
                          >
                            <Link to={`/deals/${deal.id}`} className="text-sm font-medium text-brand-blue hover:underline block">
                              {deal.name}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ${deal.value?.toLocaleString()}
                              {deal.organization_name && <span> · {deal.organization_name}</span>}
                            </p>
                            {deal.contact_name && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{deal.contact_name}</p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
