from bs4 import BeautifulSoup

with open('/home/ubuntu/browser_html/portal_myfatoorah_com_ngenius_1782082705682.html', 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

# Find the main payment card container
card = soup.find('div', class_='mfi-card') or soup.find('div', class_='mfi-payment-card') or soup.find(lambda tag: tag.name == 'div' and 'mfi' in tag.get('class', []))

with open('myfatoorah_structure2.html', 'w', encoding='utf-8') as f:
    if card:
        f.write(card.prettify())
    else:
        # Just write the body
        f.write(soup.body.prettify() if soup.body else html)

