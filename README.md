# BigQuery Release Insights Dashboard

Une application web moderne et élégante développée avec **Python Flask** et du **HTML/CSS/JavaScript natif** (Vanilla), conçue pour récupérer, structurer et afficher le flux officiel des notes de mise à jour de Google Cloud BigQuery.

---

## 🚀 Fonctionnalités Clés

- **Parsing XML Atom & HTML** : Découpage intelligent du flux global en fiches de modifications individuelles par type (*Features, Changes, Breaking, Issues, Announcements*).
- **Cache Serveur (10 min)** : Mise en mémoire tampon pour accélérer l'affichage et respecter les quotas de requêtes vers Google Cloud.
- **Recherche & Filtrage Instantanés** : Recherche textuelle en direct et filtrage par type sur le client sans requêtes supplémentaires.
- **Tableau de Bord Statistique** : Visualisation des métriques clés (nombre total de nouveautés, changements, problèmes en cours) avec filtrage au clic sur les compteurs.
- **Partage Twitter/X intégré** : Formatage automatique d'une release avec nettoyage des balises HTML, intégration de hashtags, lien officiel et troncature intelligente à 280 caractères.
- **Copie Presse-papiers** : Bouton sur chaque carte pour copier la release au format texte structuré (avec la date, le type et le lien), avec un retour visuel vert de confirmation (icône temporaire).
- **Export CSV Dynamique** : Bouton dans l'en-tête pour télécharger instantanément la liste des releases actuellement filtrées/recherchées au format CSV.
- **Design Premium & Responsive** : Thème sombre (par défaut) et thème clair, animations fluides lors du chargement ou du filtrage, et adaptation automatique pour mobiles et tablettes.

---

## 🛠 Structure du Projet

Les fichiers clés du projet sont répartis comme suit :
*   [app.py](file:///c:/dev/antiGRAV/agy-cli-projects/app.py) : Serveur Flask gérant le chargement HTTP, le cache mémoire et l'API de parsing XML/HTML.
*   [templates/index.html](file:///c:/dev/antiGRAV/agy-cli-projects/templates/index.html) : Structure de la page web avec intégration des polices Google Fonts et icônes Lucide.
*   [static/styles.css](file:///c:/dev/antiGRAV/agy-cli-projects/static/styles.css) : Styles CSS natifs, variables de thème (sombre/clair), animations et disposition responsive (Grid & Flexbox).
*   [static/app.js](file:///c:/dev/antiGRAV/agy-cli-projects/static/app.js) : Gestionnaire d'état JavaScript gérant la recherche, les filtres, le commutateur de thème et le partage Twitter/X.
*   [requirements.txt](file:///c:/dev/antiGRAV/agy-cli-projects/requirements.txt) : Liste des dépendances Python requises.
*   [.gitignore](file:///c:/dev/antiGRAV/agy-cli-projects/.gitignore) : Fichiers exclus du suivi de version Git.

---

## 📦 Installation et Lancement

### Prerequis
Avoir Python 3.9+ installé.

### 1. Activer l'Environnement Virtuel
Sous Windows PowerShell :
```powershell
.venv\Scripts\activate
```

### 2. Installer les Dépendances
```powershell
pip install -r requirements.txt
```

### 3. Lancer l'Application
```powershell
python app.py
```
Le serveur démarrera en mode débogage local sur le port 5000.

### 4. Accéder au Tableau de Bord
Ouvrez votre navigateur web et rendez-vous sur :
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📡 Détail de l'API Interne

### Requête
`GET /api/releases`

### Paramètres
*   `refresh` (optionnel) : `true` pour forcer la mise à jour et ignorer le cache serveur de 10 minutes.

### Exemple de Réponse JSON
```json
{
  "count": 68,
  "last_updated": 1781682855,
  "source": "live",
  "items": [
    {
      "id": "item-0",
      "date": "June 15, 2026",
      "timestamp": "2026-06-15T00:00:00-07:00",
      "type": "Feature",
      "content": "<p>Use Gemini Cloud Assist to analyze your SQL queries...</p>",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_15_2026"
    }
  ]
}
```
