import os
from PIL import Image
from pathlib import Path


def images_to_pdf(input_folder, output_filename):
    # 1. Lister et trier les fichiers PNG
    files = [f for f in os.listdir(input_folder) if f.lower().endswith('.png')]
    files.sort()  # Tri alphabétique pour l'ordre des pages

    if not files:
        print("Aucune image PNG trouvée dans le dossier.")
        return

    image_list = []

    for i, file in enumerate(files):
        path = os.path.join(input_folder, file)
        img = Image.open(path)

        # Conversion en mode RGB (nécessaire pour le PDF, car le PNG peut être en RGBA)
        # On utilise un fond blanc pour la transparence si nécessaire
        if img.mode in ("RGBA", "P"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
            img = background
        else:
            img = img.convert("RGB")

        if i == 0:
            first_image = img
        else:
            image_list.append(img)

    # 2. Sauvegarde en PDF
    # 'append_images' permet d'ajouter les pages suivantes
    first_image.save(
        output_filename,
        "PDF",
        resolution=img.info.get('dpi', (72, 72))[0],  # Utilise le DPI d'origine
        save_all=True,
        append_images=image_list,
        optimize=False,  # Désactive l'optimisation qui pourrait altérer les données
        subsampling=0  # Garde les données de couleur intactes
    )

    print(f"Succès ! Le PDF a été généré sous le nom : {output_filename}")


# Configuration
dossier_images = input("Veuillez entrer le chemin du dossier contenant les images : ")
path_image=Path(dossier_images.strip('"'))
nom_sortie = input("Quelle nom pour le nuancier à transmettre à l'équipe ? ")
if nom_sortie[-4:] != ".pdf":
    nom_sortie = nom_sortie+".pdf"
chemin_sortie = path_image / nom_sortie
images_to_pdf(path_image, chemin_sortie)
#nuancier_premier_essai