# 🎨 Outil de Prototypage de Thèmes (OKLCH)

Ce script est un laboratoire de couleurs interactif. Il permet de transformer l'intégralité du design du site en faisant pivoter son nuancier sur le cercle chromatique, tout en préservant l'harmonie visuelle.</br>
🕹️ **Les Commandes**

**Le script s'appuie sur trois boutons configurés dans l'interface :**

"Change the color based on oklch" (#color-switch-button) :

- Au premier clic : Ouvre une fenêtre pour choisir la "vitesse" du changement (ex: 5% pour faire le tour en 20 clics) et le mode de rendu (Adaptatif ou Objectif).

- Clics suivants : Fait progresser toutes les couleurs du site dans le spectre (Vert → Bleu → Rouge → etc.).

"Return to the last color" ("last-color-button") : Agit comme un "Ctrl+Z". Permet de revenir précisément sur une nuance que vous venez de dépasser.

"Return to the original color" (#color-reset-button) : Efface toutes les modifications temporaires et restaure le thème d'origine défini dans le CSS.

💡 Concepts de fonctionnement
#### 1. La Rotation de Teinte

Plutôt que de remplacer les couleurs une par une, le script applique un décalage d'angle (en degrés) à toutes les variables CSS du site.

Si vous aviez un bouton vert foncé et un fond vert clair, ils deviendront un bouton bleu foncé et un fond bleu clair.

L'harmonie et les contrastes sont préservés automatiquement.

#### 2. Mode Adaptatif vs Objectif

L'œil humain perçoit les couleurs bizarrement : un jaune nous paraît naturellement beaucoup plus clair qu'un bleu, même s'ils ont la même intensité technique.

Mode Adaptatif (Boost) : Le script "aide" les couleurs comme le jaune ou l'orange en augmentant leur luminosité pour qu'elles restent éclatantes et non "marron/sales".

Mode Objectif (Pur) : Applique la rotation mathématique exacte de l'espace OKLCH, sans correction humaine.

#### 3. Extraction des valeurs

L'outil est conçu pour aider au choix de la future charte graphique. À chaque changement, la Console du navigateur (F12) affiche :

L'angle de rotation actuel.

La valeur oklch() exacte de la couleur principale.

Note : Si une couleur vous plaît pendant la démo, il suffit de noter la valeur affichée en console pour l'intégrer définitivement au code du projet.

💾 **Persistance**

Le réglage (vitesse, mode, position actuelle) est sauvegardé dans le LocalStorage de votre navigateur. Vous pouvez rafraîchir la page ou changer d'onglet sans perdre votre progression dans le tour des couleurs.