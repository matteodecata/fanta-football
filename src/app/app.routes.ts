import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
    {
        path:'',
        pathMatch: 'full',
        redirectTo: 'landing',
    },
    {
        path: 'landing',
        title: 'Landing Page',
        loadComponent: () => import('./landing-page/landing-page')
            .then((component) => component.LandingPage),
    },
    {
        path: 'login',
        title: 'Login',
        loadComponent: () => import('./login/login')
            .then((component) => component.Login),
    },
    {
        path: 'register',
        title: 'Registrati',
        loadComponent: () => import('./register/register')
            .then((component) => component.Register),
    },
    {
        path: 'forgot-password',
        title: 'Password dimenticata',
        loadComponent: () => import('./forgot-password/forgot-password')
            .then((component) => component.ForgotPassword),
    },
    {
        path: 'reset-password',
        title: 'Reimposta password',
        loadComponent: () => import('./reset-password/reset-password')
            .then((component) => component.ResetPassword),
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        title: 'Dashboard',
        loadComponent: () => import('./dashboard/dashboard')
            .then((component) => component.Dashboard),
    },
    {
        path: 'account',
        canActivate: [authGuard],
        title: 'Account',
        loadComponent: () => import('./account/account')
            .then((component) => component.Account),
    },
    {
        path: 'players',
        canActivate: [authGuard],
        title: 'Calciatori',
        loadComponent: () => import('./players/players')
            .then((component) => component.Players),
    },
    {
        path: 'leagues/new',
        canActivate: [authGuard],
        title: 'Nuova lega',
        loadComponent: () => import('./leagues-new/leagues-new')
            .then((component) => component.LeaguesNew),
    },
    {
        path: 'leagues/:leagueId/team/new',
        canActivate: [authGuard],
        title: 'Crea squadra',
        loadComponent: () => import('./league-team-new/league-team-new')
            .then((component) => component.LeagueTeamNew),
    },
    {
        path: 'leagues/:leagueId',
        canActivate: [authGuard],
        title: 'Dettaglio lega',
        loadComponent: () => import('./league-detail/league-detail')
            .then((component) => component.LeagueDetail),
    },
    {
        path: 'teams/:teamId/trades',
        canActivate: [authGuard],
        title: 'Scambi squadra',
        loadComponent: () => import('./team-trades/team-trades')
            .then((component) => component.TeamTrades),
    },
    {
        path: 'teams/:teamId',
        canActivate: [authGuard],
        title: 'Squadra',
        loadComponent: () => import('./team-detail/team-detail')
            .then((component) => component.TeamDetail),
    },
    {
        path: '**',
        title: 'Pagina non trovata',
        loadComponent: () => import('./not-found/not-found')
            .then((component) => component.NotFound),
    },
];
