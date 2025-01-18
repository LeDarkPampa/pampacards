import os
import json

def generate_assets_json(base_path):
    # Dictionnaire pour stocker les chemins d'images
    assets_structure = {
        "heads": [],
        "hats": [],
        "bodies": [],
        "backs": [],
        "adds": []
    }

    # Chemin de départ pour les avatars
    avatars_path = os.path.join(base_path, "assets", "avatars")

    # Parcours des dossiers et fichiers
    for root, _, files in os.walk(avatars_path):
        for file in files:
            if file.endswith(('.png', '.jpg', '.jpeg')):  # Filtre pour les images
                full_path = os.path.join(root, file)  # Chemin absolu du fichier
                relative_path = os.path.relpath(full_path, base_path)  # Chemin relatif à base_path
                normalized_path = os.path.normpath(relative_path).replace("\\", "/")  # Convertir \ en /

                # Extraire la catégorie (nom du dossier parent immédiat)
                category = os.path.basename(os.path.dirname(normalized_path))

                # Ajouter le chemin d'image et la catégorie dans la structure appropriée
                if "heads" in root:
                    assets_structure["heads"].append({"src": normalized_path, "category": category})
                elif "hats" in root:
                    assets_structure["hats"].append({"src": normalized_path, "category": category})
                elif "bodies" in root:
                    assets_structure["bodies"].append({"src": normalized_path, "category": category})
                elif "backs" in root:
                    assets_structure["backs"].append({"src": normalized_path, "category": category})
                elif "adds" in root:
                    assets_structure["adds"].append({"src": normalized_path, "category": category})

    # Écriture dans un fichier JSON
    output_path = os.path.join(base_path, "assets_structure.json")
    with open(output_path, "w", encoding="utf-8") as json_file:
        json.dump(assets_structure, json_file, indent=4, ensure_ascii=False)

    print(f"Fichier JSON généré : {output_path}")

if __name__ == "__main__":
    # Chemin de la racine du projet (ajustez si nécessaire)
    project_root = os.path.abspath(".")
    generate_assets_json(project_root)
