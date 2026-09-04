import { Routes } from '@angular/router';

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
        title: 'Dashboard',
        loadComponent: () => import('./dashboard/dashboard')
            .then((component) => component.Dashboard),
    },
    {
        path: 'account',
        title: 'Account',
        loadComponent: () => import('./account/account')
            .then((component) => component.Account),
    },
    {
        path: 'players',
        title: 'Calciatori',
        loadComponent: () => import('./players/players')
            .then((component) => component.Players),
    },
    {
        path: 'leagues/new',
        title: 'Nuova lega',
        loadComponent: () => import('./league-create/league-create')
            .then((component) => component.LeagueCreate),
    },
    {
        path: 'leagues/:leagueId/team/new',
        title: 'Crea squadra',
        loadComponent: () => import('./team-create/team-create')
            .then((component) => component.TeamCreate),
    },
    {
        path: 'leagues/:leagueId',
        title: 'Dettaglio lega',
        loadComponent: () => import('./league-detail/league-detail')
            .then((component) => component.LeagueDetail),
    },
    {
        path: 'teams/:teamId/trades',
        title: 'Scambi squadra',
        loadComponent: () => import('./team-trades/team-trades')
            .then((component) => component.TeamTrades),
    },
    {
        path: 'teams/:teamId',
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
