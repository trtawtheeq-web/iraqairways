import re

with open('client/public/jazeera-home.html', 'r') as f:
    content = f.read()

# Find the offers track
track_start = content.find('<div class="offers-carousel-track')
if track_start != -1:
    track_end = content.find('</div>', content.rfind('<!-- Offer Card 6 -->')) + 6
    # The track ends with a closing div for the track itself, but we need to be careful
    # Let's just replace the whole track content
    
    # Extract the J950AB card (Offer Card 3)
    card3_start = content.find('<!-- Offer Card 3 -->')
    card3_end = content.find('<!-- Offer Card 4 -->')
    
    if card3_start != -1 and card3_end != -1:
        card3_content = content[card3_start:card3_end]
        
        # Find the start of the track content (after the track div opening)
        track_inner_start = content.find('>', track_start) + 1
        
        # Find the end of the track content (before the track div closing)
        # It's right before the next section
        track_inner_end = content.find('</div></div></div></div></div><div class="jsx-891d3f987ff2859a mt-12 lg:mt-16 fade-in-up visible" id="destinations">')
        if track_inner_end == -1:
            # Try another way to find the end
            track_inner_end = content.find('<!-- Offer Card 6 -->')
            track_inner_end = content.find('</div>', track_inner_end) + 6 # close inner div
            track_inner_end = content.find('</div>', track_inner_end) + 6 # close outer div
            track_inner_end = content.find('</div>', track_inner_end) + 6 # close track div
            track_inner_end -= 6 # go back before the track div closing
            
        # Replace the track content with just card 3
        new_content = content[:track_inner_start] + '\n' + card3_content + '\n' + content[track_inner_end:]
        
        with open('client/public/jazeera-home.html', 'w') as f:
            f.write(new_content)
        print("Successfully replaced offers with just J950AB")
    else:
        print("Could not find Offer Card 3 or 4")
else:
    print("Could not find offers track")
