import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/home-page/home-page').then((module) => module.HomePage),
  },
  {
    path: 'estudiantes',
    loadComponent: () =>
      import('./components/student-registration-page/student-registration-page').then(
        (module) => module.StudentRegistrationPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
