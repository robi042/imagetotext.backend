import cv2
import pytesseract
from PIL import Image
import matplotlib
import sys

matplotlib.use('TkAgg')
import matplotlib.pyplot as plt

sys.stdout.reconfigure(encoding='utf-8')


def preprocess_image(image_path, crop_coords=None):
    image = cv2.imread(image_path)

    original_height, original_width = image.shape[:2]

    if original_height != 1080 or original_width != 1080:
        aspect_ratio = min(1080 / original_width, 1080 / original_height)
        new_width = int(original_width * aspect_ratio)
        new_height = int(original_height * aspect_ratio)
        resized_image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_LINEAR)

        delta_w = 1080 - new_width
        delta_h = 1080 - new_height
        top, bottom = delta_h // 2, delta_h - (delta_h // 2)
        left, right = delta_w // 2, delta_w - (delta_w // 2)
        resized_image = cv2.copyMakeBorder(resized_image, top, bottom, left, right, cv2.BORDER_CONSTANT, value=[0, 0, 0])
    else:
        resized_image = image

    height, width = resized_image.shape[:2]

    if crop_coords:
        x, y, w, h = crop_coords
        if w == 0:
            w = width
        resized_image = resized_image[y:y + h, x:x + w]

    gray_image = cv2.cvtColor(resized_image, cv2.COLOR_BGR2GRAY)
    _, binary_image = cv2.threshold(gray_image, 150, 255, cv2.THRESH_BINARY_INV)
    denoised_image = cv2.medianBlur(binary_image, 3)

    return denoised_image


def display_image(image):
    plt.imshow(image, cmap='gray')
    plt.title('Cropped Image')
    plt.axis('off')
    plt.show()


def extract_bangla_text(image_path, crop_coords=None):
    processed_image = preprocess_image(image_path, crop_coords)

    #display_image(processed_image)

    pil_image = Image.fromarray(processed_image)

    config = '--oem 3 --psm 6'

    extracted_text = pytesseract.image_to_string(pil_image, lang='ben', config=config)

    return extracted_text


def check_bangla_text_match(image_path, crop_coords):
    bangla_text = extract_bangla_text(image_path, crop_coords)
    normalized_text = bangla_text.replace('\n', ' ').replace('\r', '').strip()

    # target_text = "এ বছর কমনওয়েলথ বৃত্তি পেলেন\n২৬ বাংলাদেশি, স্বাগত জানালেন যুক্তরাজ্যের\nহাইকমিশনার সারাহ"
    # print(target_text)
    normalized_text = ' '.join(normalized_text.split())
    return normalized_text

    # Compare the extracted text with the target text
    # if normalized_text == target_text:
    #     return True
    # else:
    #     return False


if __name__ == '__main__':
    #newsPaper = sys.argv[1]
    image_path = sys.argv[2]
    input_str = sys.argv[1]
#     if newsPaper == "prothom alo":
#     crop_coords = (0, 110, 0, 300)
# elif newsPaper == "jamuna":
#     crop_coords = (0, 700, 0, 300)
# elif newsPaper == "somoy":
#     crop_coords = (0, 700, 0, 300)
# elif newsPaper == "channel i":
#     crop_coords = (0, 120, 0, 300)
# elif newsPaper == "r tv":
#     crop_coords = (0, 680, 0, 290)
# elif newsPaper == "dbc":
#     crop_coords = (0, 680, 0, 250)
# else:
#     print("Invalid news paper")
#     exit()
    crop_coords = tuple(map(int, input_str.split(',')))
    is_match = check_bangla_text_match(image_path, crop_coords)

    print(is_match)
