import { createClient } from '@supabase/supabase-js';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export const demoEnabled = !url && !key && import.meta.env.DEV;
export const categories = ['Études & pédagogie', 'Vie sur le campus', 'Bien-être & santé', 'Administration', 'Finances & logement', 'Autre'];
export type Feedback = { id: string; category: string; title: string; problem: string; solution: string; impact: string; status: string; created_at: string };
export const demoFeedback: Feedback[] = [
  { id: 'demo-1', category: categories[0], title: 'Des espaces pour réviser ensemble', problem: 'Il est difficile de trouver une salle calme disponible pour travailler en groupe pendant les examens.', solution: 'Ouvrir les salles inutilisées et proposer un système de réservation.', impact: 'Modéré', status: 'En cours', created_at: new Date().toISOString() },
  { id: 'demo-2', category: categories[1], title: 'Plus de choix à la cafétéria', problem: 'Les options végétariennes sont limitées et se ressemblent chaque semaine.', solution: 'Proposer un menu végétarien différent chaque jour.', impact: 'Faible', status: 'Nouveau', created_at: new Date(Date.now()-86400000).toISOString() },
  { id: 'demo-3', category: categories[2], title: 'Un accompagnement plus accessible', problem: 'Les délais pour un rendez-vous avec le service de soutien sont trop longs.', solution: 'Ajouter des permanences sans rendez-vous.', impact: 'Important', status: 'Nouveau', created_at: new Date(Date.now()-172800000).toISOString() },
  { id: 'demo-4', category: categories[3], title: 'Simplifier les démarches', problem: 'Les documents nécessaires aux inscriptions sont dispersés sur plusieurs pages.', solution: 'Créer une liste unique des documents et des échéances.', impact: 'Modéré', status: 'Résolu', created_at: new Date(Date.now()-259200000).toISOString() },
];
