module HarvardAeon
  class ResourceMapper < ItemMapper

    RequestList.register_item_mapper(self, :harvard_aeon, Resource)

    def show_button?(item)
      # only if childless
      ArchivesSpaceClient.instance.get_raw_record(item['uri'] + '/tree/root')['child_count'] == 0
    end


    def map(item)
      request_number_for({
        'ItemInfo2' => hollis_number_for(item['json']),
        'ItemTitle' => strip_mixed_content(item['title']),
        'ItemAuthor' => (item.raw["creators"] || []).join('; '), 
        'ItemDate' => creation_date_for(item['json']),
        'Location' => repo_field_for(item, 'Location'),
        'Site' => repo_field_for(item, 'Site'),
      })
    end

  end
end