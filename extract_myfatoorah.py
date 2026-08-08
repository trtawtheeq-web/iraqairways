from bs4 import BeautifulSoup
import json

with open('/home/ubuntu/browser_html/portal_myfatoorah_com_ngenius_1782082705682.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Find the main container
container = soup.find('div', class_='container') or soup.find('div', class_='card') or soup.find('form')

# Extract inline styles or linked stylesheets if possible
styles = soup.find_all('style')
style_content = "\n".join([s.get_text() for s in styles])

# Save the relevant parts
with open('myfatoorah_structure.html', 'w', encoding='utf-8') as f:
    if container:
        f.write(container.prettify())
    else:
        f.write(soup.body.prettify() if soup.body else html)

with open('myfatoorah_styles.css', 'w', encoding='utf-8') as f:
    f.write(style_content)

print("Extraction complete.")
