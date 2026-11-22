# StepKick

Kids learning games at [stepkick.com](https://stepkick.com): quizzes, play modes and a sticker book, plus two voice apps.

- **Main app** (`src/`): TypeScript + Vite PWA. Subjects are `SubjectPack`s in `src/subjects/`; play modes in `src/ui/`.
- **Riddles** (`public/riddles/`) and **Mots** (`public/french/`, French vocabulary): single-file voice apps with recorded voices.

```sh
npm run dev      # local dev server
npm run smoke    # plays every subject and mode, checks for errors
npm run deploy   # build and publish (pushing to main also deploys)
```
