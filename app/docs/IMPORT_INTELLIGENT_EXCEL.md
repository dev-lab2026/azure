# Import intelligent Excel / CSV

Le module permet d'alimenter PostgreSQL depuis un classeur métier sans préparer un JSON.

## Flux

1. L'utilisateur ouvre **Importer Excel**.
2. Le serveur lit toutes les feuilles XLSX/XLS/CSV.
3. Les en-têtes sont normalisés (français/anglais, accents, espaces).
4. Chaque feuille est classée automatiquement : `projects`, `tasks` ou `milestones`.
5. Les colonnes sont adaptées au modèle Clarity.
6. Les tâches et jalons sont rattachés par `Project ID` ou `Project Code`.
7. Le même fichier peut contenir les projets ET leurs tâches/jalons : les projets sont pré-normalisés afin que leurs codes puissent servir de référence pendant l'analyse.
8. L'utilisateur vérifie l'aperçu.
9. L'import confirmé écrit dans PostgreSQL via les méthodes métier existantes.

## Colonnes reconnues

### Projet

`Code`, `Project Code`, `Code Projet`, `Project ID`, `Name`, `Projet`, `Project Name`, `Description`, `Client`, `Manager`, `Chef de Projet`, `Status`, `Statut`, `Priority`, `Start Date`, `Date Début`, `End Date`, `Date Fin`, `Budget`, `BAC`, `Currency`.

### Tâche

`Project ID`, `Project Code`, `Code Projet`, `Task`, `Task Name`, `Task Title`, `Tâche`, `Title`, `Status`, `Statut`, `Priority`, `Start Date`, `Due Date`, `End Date`, `Progress`, `Avancement`, `Estimated Hours`, `Actual Hours`, `Cost Estimated`, `Cost Actual`, `Assignee ID`.

### Jalon

`Project ID`, `Project Code`, `Code Projet`, `Milestone`, `Milestone Name`, `Jalon`, `Title`, `Target Date`, `Date Jalon`, `Completed`, `Terminé`, `Deliverable`, `Livrable`.

## Exemple recommandé

Un classeur peut contenir trois feuilles :

- `Projects`
- `Tasks`
- `Milestones`

Les tâches et jalons peuvent utiliser le même `Project Code` que la feuille Projects.

## Sécurité

Le fichier est traité en mémoire côté serveur par Multer/XLSX. L'application ne le conserve pas comme fichier métier après traitement.
