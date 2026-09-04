import { Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';

@Component({
  // Tag HTML con cui league-create lo userà: <app-create-admin-team ... />
  selector: 'app-create-admin-team',

  // Serve FormField perché anche questo template avrà un <input>
  // collegato tramite [formField].
  imports: [FormField],

  templateUrl: './create-admin-team.html',
  styleUrl: './create-admin-team.css',
})
export class CreateAdminTeam {
  // Questo componente NON ha un suo model, NON ha un suo form().
  // Riceve dal genitore (league-create) un pezzo già pronto del SUO
  // albero — cioè leagueForm.teamName — e lo passa al template.
  //
  // input.required<...>() dice ad Angular: "questo componente si aspetta
  // che chi lo usa gli passi obbligatoriamente questo dato tramite
  // l'attributo [teamNameField]". Se league-create dimentica di passarlo,
  // TypeScript segnala l'errore in fase di compilazione.
  teamNameField = input.required<FieldTree<string>>();
}