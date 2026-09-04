// TODO (step HttpClient): configura qui il proxy di sviluppo.
//
// A cosa serve: quando il componente/servizio Angular chiama un URL relativo
// tipo '/api/players', il dev server di Angular (http://localhost:4200) deve
// inoltrare quella richiesta al backend Spring Boot reale (vedi
// PROJECT_CONTEXT.md, sezione 5) invece di cercare '/api/players' su se stesso.
// Senza questo, il browser andrebbe in errore CORS o 404.
//
// L'Angular CLI si aspetta un `export default` con questa forma:
//
// export default {
//   '<path-da-intercettare>': {
//     target: '<url-del-backend>',
//     secure: false,
//     changeOrigin: true,
//     logLevel: 'debug', // utile mentre impari: vedrai nel terminale ogni richiesta inoltrata
//   },
// };
//
// Domande per orientarti (vedi PROJECT_CONTEXT.md sezione 5):
// - Qual è il prefisso comune a tutte le chiamate API che farete (guarda gli
//   endpoint elencati nel documento, es. '/api/auth/login', '/api/players')?
// - Su quale porta gira il backend Spring Boot?
//
// Scrivi qui sotto la configurazione reale, poi chiedimi una review.

export default {
  // TODO: sostituisci con la configurazione reale
  '/api': {
    target: 'http://localhost:8081',
    secure: false,
    changeOrigin: true,
  }
};
