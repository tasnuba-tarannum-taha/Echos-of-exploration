import os
import zipfile

def make_zip():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    public_dir = os.path.join(base_dir, 'public')
    os.makedirs(public_dir, exist_ok=True)
    zip_path = os.path.join(public_dir, 'echoes-of-exploration.zip')
    
    exclude_dirs = {'node_modules', 'dist', '.git', '.cache', '__pycache__'}
    exclude_files = {'.env', 'echoes-of-exploration.zip'}

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            for file in files:
                if file in exclude_files or file.endswith('.zip'):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir)
                if rel_path.startswith('public' + os.sep) and rel_path.endswith('.zip'):
                    continue
                zipf.write(full_path, arcname=os.path.join('echoes-of-exploration', rel_path))

    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f'Archive created: {zip_path} ({size_mb:.2f} MB)')

if __name__ == '__main__':
    make_zip()
